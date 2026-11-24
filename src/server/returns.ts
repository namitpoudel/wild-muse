import "server-only";
import { db } from "./db";
import { sendEmail } from "./email";
import { layout } from "./email/templates";
import { formatOrderNumber } from "./orders/format";
import { getSettings } from "./settings";

/**
 * Returns. UK law gives a 14-day cancellation right from the day goods are received
 * (Consumer Contracts Regulations 2013); the shop's own returns window (default 30 days)
 * applies on top. Delivery date = recorded delivery, else dispatch + 3 days.
 */
export interface ReturnLine {
  orderItemId: string;
  quantity: number;
}

export async function returnEligibility(orderId: string) {
  const s = await getSettings();
  const o = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { shipments: true, returns: true, items: true } });
  if (!["DISPATCHED", "DELIVERED", "PARTIALLY_REFUNDED"].includes(o.status))
    return { eligible: false as const, reason: "Returns open once your order has been dispatched." };
  if (o.returns.some((r) => ["REQUESTED", "APPROVED"].includes(r.status)))
    return { eligible: false as const, reason: "You already have a return in progress for this order." };
  const delivered =
    o.shipments.map((sh) => sh.deliveredAt ?? (sh.dispatchedAt ? new Date(sh.dispatchedAt.getTime() + 3 * 86400_000) : null)).find(Boolean) ?? null;
  if (!delivered) return { eligible: false as const, reason: "We'll open returns once your parcel is on its way." };
  const days = Math.floor((Date.now() - delivered.getTime()) / 86400_000);
  if (days > s.commerce.returnDays)
    return {
      eligible: false as const,
      reason: `The ${s.commerce.returnDays}-day returns window for this order has closed. If an item is faulty, please contact us.`,
    };
  return { eligible: true as const, statutory: days <= 14, daysLeft: s.commerce.returnDays - days, items: o.items };
}

export async function createReturnRequest(opts: { orderId: string; lines: ReturnLine[]; reason: string }) {
  const elig = await returnEligibility(opts.orderId);
  if (!elig.eligible) throw new Error(elig.reason);
  const items = opts.lines
    .map((l) => {
      const it = elig.items.find((i) => i.id === l.orderItemId);
      if (!it || l.quantity < 1 || l.quantity > it.quantity - it.refundedQuantity) return null;
      return {
        orderItemId: it.id,
        name: it.productName,
        sku: it.sku,
        colour: it.colour,
        size: it.size,
        quantity: l.quantity,
        unitPricePence: it.unitPricePence,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  if (!items.length) throw new Error("Choose at least one item to return.");
  const r = await db.returnRequest.create({ data: { orderId: opts.orderId, items, reason: opts.reason, isStatutoryCancellation: elig.statutory } });
  const o = await db.order.findUniqueOrThrow({ where: { id: opts.orderId } });
  const s = await getSettings();
  const ref = formatOrderNumber(o.orderNumber);
  const lines = items.map((i) => `${i.quantity} × ${i.name} (${i.colour}, ${i.size})`);
  const customer = await layout({
    title: "We've received your return request",
    intro: `Thanks — we've logged a return for order ${ref}. We'll review it and email you the return address and instructions within one working day.`,
    paragraphs: [
      ...lines,
      "Please don't post anything until you receive our instructions. Refunds are made within 14 days of us receiving the items (or proof you've posted them).",
    ],
  });
  await sendEmail({
    to: o.email,
    subject: `Return request received — ${ref}`,
    html: customer.html,
    text: customer.text,
    tags: { type: "return-requested" },
  });
  const shop = await layout({
    title: `Return requested — ${ref}`,
    intro: `Reason: ${opts.reason}${elig.statutory ? " (within the 14-day statutory cancellation period)" : ""}`,
    paragraphs: lines,
  });
  await sendEmail({ to: s.business.email, subject: `Return requested — ${ref}`, html: shop.html, text: shop.text, tags: { type: "admin-return" } });
  return r;
}

export async function emailReturnDecision(returnId: string, approved: boolean, note: string) {
  const r = await db.returnRequest.findUniqueOrThrow({ where: { id: returnId }, include: { order: true } });
  const s = await getSettings();
  const ref = formatOrderNumber(r.order.orderNumber);
  const { html, text } = await layout(
    approved
      ? {
          title: "Your return is approved",
          intro: `Please send the item(s) from order ${ref} back to us using a tracked service and keep your proof of postage.`,
          paragraphs: [
            `Return address: ${s.business.legalName}, ${s.business.address}`,
            `Please include a note with your order number ${ref}.`,
            note,
          ].filter(Boolean),
        }
      : {
          title: "About your return request",
          intro: `We're unable to accept the return for order ${ref}.`,
          paragraphs: [note, "If you think this is a mistake, just reply to this email."].filter(Boolean),
        },
  );
  await sendEmail({
    to: r.order.email,
    subject: `${approved ? "Return approved" : "Return update"} — ${ref}`,
    html,
    text,
    replyTo: s.business.email,
    tags: { type: "return-decision" },
  });
}
