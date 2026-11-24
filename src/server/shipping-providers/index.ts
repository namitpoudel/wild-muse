import "server-only";
import { expire, TAGS } from "../cache";
import { db } from "../db";
import { sendDispatchEmail } from "../orders/notifications";
import { formatOrderNumber } from "../orders/format";
import { CARRIERS } from "../shipping-tracking";
import { createClickAndDropOrder, getClickAndDropOrder, isClickAndDropConfigured } from "./click-and-drop";

/**
 * Shipping providers. "manual" (always available): staff enter the carrier + tracking number.
 * "clickanddrop": Royal Mail Click & Drop API. More carriers (DPD, Evri, Parcel2Go) can be
 * added as further adapters without touching checkout or order code.
 */
export const shippingProviders = {
  clickanddrop: { name: "Royal Mail Click & Drop", configured: isClickAndDropConfigured },
};

type Addr = { fullName: string; line1: string; line2?: string | null; city: string; county?: string | null; postcode: string; phone?: string | null };

/** Push a paid order to Click & Drop and record a pending shipment. */
export async function sendToClickAndDrop(orderId: string) {
  const o = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: { include: { variant: { select: { weightGrams: true } } } }, shipments: true },
  });
  if (!["PAID", "PROCESSING"].includes(o.status)) throw new Error("Only paid orders can be sent to Click & Drop.");
  if (o.shipments.some((s) => s.providerRef && s.carrier === "Royal Mail")) throw new Error("This order has already been sent to Click & Drop.");
  const created = await createClickAndDropOrder({
    reference: formatOrderNumber(o.orderNumber),
    email: o.email,
    orderDate: o.placedAt ?? o.createdAt,
    address: o.shippingAddress as unknown as Addr,
    items: o.items.map((i) => ({
      name: `${i.productName} (${i.colour}, ${i.size})`,
      sku: i.sku,
      quantity: i.quantity,
      unitPricePence: i.unitPricePence,
      unitWeightGrams: i.variant?.weightGrams ?? 400,
    })),
    subtotalPence: o.subtotalPence - o.discountPence,
    shippingPence: o.shippingPence,
    totalPence: o.totalPence,
    instructions: o.deliveryInstructions,
  });
  await db.$transaction([
    db.shipment.create({
      data: {
        orderId: o.id,
        carrier: "Royal Mail",
        service: "Click & Drop",
        providerRef: created.orderIdentifier,
        status: "PENDING",
        events: { create: { status: "PENDING", description: "Sent to Royal Mail Click & Drop" } },
      },
    }),
    db.order.update({ where: { id: o.id }, data: { status: "PROCESSING" } }),
  ]);
  return created;
}

/** Pull tracking from Click & Drop; once shipped, mark dispatched and email the customer. */
export async function syncClickAndDropShipment(shipmentId: string): Promise<"dispatched" | "label-printed" | "waiting"> {
  const s = await db.shipment.findUniqueOrThrow({ where: { id: shipmentId } });
  if (!s.providerRef || s.status === "DISPATCHED" || s.status === "DELIVERED") return "waiting";
  const r = await getClickAndDropOrder(s.providerRef);
  if (!r) return "waiting";
  if (r.trackingNumber && r.shippedOn) {
    const trackingUrl = CARRIERS.royalmail.url(r.trackingNumber);
    await db.$transaction([
      db.shipment.update({
        where: { id: s.id },
        data: { trackingNumber: r.trackingNumber, trackingUrl, status: "DISPATCHED", dispatchedAt: new Date(r.shippedOn) },
      }),
      db.shipmentEvent.create({ data: { shipmentId: s.id, status: "DISPATCHED", description: "Dispatched with Royal Mail" } }),
      db.order.update({ where: { id: s.orderId }, data: { status: "DISPATCHED" } }),
    ]);
    await sendDispatchEmail(s.orderId, { carrier: "Royal Mail", trackingNumber: r.trackingNumber, trackingUrl }).catch(() => {});
    expire(TAGS.orders);
    return "dispatched";
  }
  if (r.printedOn && s.status === "PENDING") {
    await db.shipment.update({ where: { id: s.id }, data: { status: "LABEL_CREATED", trackingNumber: r.trackingNumber } });
    return "label-printed";
  }
  return "waiting";
}

export async function syncPendingClickAndDrop() {
  if (!isClickAndDropConfigured()) return 0;
  const pending = await db.shipment.findMany({
    where: { carrier: "Royal Mail", providerRef: { not: null }, status: { in: ["PENDING", "LABEL_CREATED"] } },
    select: { id: true },
    take: 50,
  });
  let n = 0;
  for (const s of pending) if ((await syncClickAndDropShipment(s.id).catch(() => "waiting")) === "dispatched") n++;
  return n;
}
