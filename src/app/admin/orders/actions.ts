"use server";

import { z } from "zod";
import { fail, ok } from "@/app/actions/result";
import { zBool } from "@/lib/zod-helpers";
import { adminAction, AdminError, formToObject } from "@/server/admin/action";
import { TAGS } from "@/server/cache";
import { db } from "@/server/db";
import { formatOrderNumber } from "@/server/orders/format";
import { sendCancellationEmail, sendDispatchEmail } from "@/server/orders/notifications";
import { cancelPaidOrder, cancelPendingOrder } from "@/server/orders/orders";
import { audit } from "@/server/security/audit";
import { CARRIERS } from "@/server/shipping-tracking";

const NEXT: Record<string, string[]> = {
  PAID: ["PROCESSING"],
  PROCESSING: ["PAID"],
  DISPATCHED: ["DELIVERED"],
  DELIVERED: ["DISPATCHED"],
};

const setStatus = adminAction(
  "orders.update",
  z.object({ id: z.string().max(40), status: z.enum(["PAID", "PROCESSING", "DELIVERED", "DISPATCHED"]) }),
  async ({ id, status }, actor) => {
    const o = await db.order.findUnique({ where: { id } });
    if (!o) throw new AdminError("Order not found.");
    if (!NEXT[o.status]?.includes(status))
      throw new AdminError(`Can't change an order from ${o.status.toLowerCase()} to ${status.toLowerCase()}. Use "Dispatch" to add tracking.`);
    await db.order.update({ where: { id }, data: { status } });
    if (status === "DELIVERED")
      await db.shipment.updateMany({ where: { orderId: id, deliveredAt: null }, data: { status: "DELIVERED", deliveredAt: new Date() } });
    await audit(
      actor,
      "order.status",
      { type: "Order", id },
      { summary: `${formatOrderNumber(o.orderNumber)}: ${o.status} → ${status}`, before: { status: o.status }, after: { status } },
    );
    return ok(null, "Status updated");
  },
  { tags: [TAGS.orders] },
);
export async function setOrderStatusAction(fd: FormData) {
  return setStatus(formToObject(fd));
}

const dispatch = adminAction(
  "orders.update",
  z.object({
    id: z.string().max(40),
    carrier: z.enum(Object.keys(CARRIERS) as [string, ...string[]]),
    service: z.string().trim().max(60).optional(),
    trackingNumber: z
      .string()
      .trim()
      .max(60)
      .regex(/^[A-Za-z0-9 -]*$/, "Letters, numbers and spaces only")
      .optional(),
    trackingUrl: z.url().max(300).optional().or(z.literal("")),
    notify: zBool,
  }),
  async (d, actor) => {
    const o = await db.order.findUnique({ where: { id: d.id } });
    if (!o) throw new AdminError("Order not found.");
    if (!["PAID", "PROCESSING", "DISPATCHED"].includes(o.status)) throw new AdminError("Only paid orders can be dispatched.");
    const c = CARRIERS[d.carrier];
    const trackingUrl = d.trackingUrl || (d.trackingNumber ? c.url(d.trackingNumber.replace(/\s/g, "")) : "") || null;
    await db.$transaction(async (tx) => {
      const s = await tx.shipment.create({
        data: {
          orderId: o.id,
          carrier: c.name,
          service: d.service || null,
          trackingNumber: d.trackingNumber || null,
          trackingUrl,
          status: "DISPATCHED",
          dispatchedAt: new Date(),
        },
      });
      await tx.shipmentEvent.create({ data: { shipmentId: s.id, status: "DISPATCHED", description: `Dispatched with ${c.name}` } });
      await tx.order.update({ where: { id: o.id }, data: { status: "DISPATCHED" } });
      await audit(
        actor,
        "order.dispatch",
        { type: "Order", id: o.id },
        { summary: `${formatOrderNumber(o.orderNumber)} via ${c.name} ${d.trackingNumber ?? ""}` },
        tx,
      );
    });
    if (d.notify) await sendDispatchEmail(o.id, { carrier: c.name, trackingNumber: d.trackingNumber, trackingUrl });
    return ok(null, d.notify ? "Dispatched — customer notified" : "Dispatched");
  },
  { tags: [TAGS.orders] },
);
export async function dispatchOrderAction(fd: FormData) {
  return dispatch(formToObject(fd));
}

const cancel = adminAction(
  "orders.update",
  z.object({ id: z.string().max(40), reason: z.string().trim().min(3, "Give a reason").max(300), restock: zBool, notify: zBool }),
  async (d, actor) => {
    const o = await db.order.findUnique({ where: { id: d.id } });
    if (!o) throw new AdminError("Order not found.");
    let done = false;
    if (o.status === "PENDING_PAYMENT") done = await cancelPendingOrder(o.id, d.reason);
    else if (o.status === "PAID" || o.status === "PROCESSING")
      done = await cancelPaidOrder(o.id, { reason: d.reason, restock: d.restock, actorId: actor.id });
    else throw new AdminError("Dispatched orders can't be cancelled — process a return/refund instead.");
    if (!done) throw new AdminError("The order changed while you were editing it. Please reload.");
    await audit(
      actor,
      "order.cancel",
      { type: "Order", id: o.id },
      { summary: `${formatOrderNumber(o.orderNumber)}: ${d.reason}${d.restock ? " (restocked)" : ""}` },
    );
    if (d.notify) await sendCancellationEmail(o.id, d.reason);
    return ok(null, o.status === "PENDING_PAYMENT" ? "Cancelled" : "Cancelled — remember to issue the refund");
  },
  { tags: [TAGS.orders, TAGS.products] },
);
export async function cancelOrderAction(fd: FormData) {
  return cancel(formToObject(fd));
}

const notes = adminAction("orders.update", z.object({ id: z.string().max(40), internalNotes: z.string().max(4000) }), async (d, actor) => {
  await db.order.update({ where: { id: d.id }, data: { internalNotes: d.internalNotes || null } });
  await audit(actor, "order.notes", { type: "Order", id: d.id });
  return ok(null, "Notes saved");
});
export async function saveOrderNotesAction(fd: FormData) {
  return notes(formToObject(fd));
}

/** Refunds go through the payment provider so money actually moves — wired to Stripe in Stage 5. */
export async function refundOrderAction(_fd: FormData) {
  void _fd;
  return fail("Refunds are issued through Stripe and are connected in Stage 5. Until then, refund from the Stripe dashboard.");
}
