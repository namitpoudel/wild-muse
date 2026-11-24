import "server-only";
import { siteConfig } from "@/config/site";
import { formatPenceExact } from "@/lib/money";
import { db } from "../db";
import { sendEmail } from "../email";
import { layout } from "../email/templates";
import { formatOrderNumber } from "./format";

/** Customer emails for order lifecycle events. */
const url = (p: string) => new URL(p, siteConfig.url).toString();

export async function sendOrderConfirmation(orderId: string) {
  const o = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  const { html, text } = await layout({
    title: `Thank you for your order ${formatOrderNumber(o.orderNumber)}`,
    intro: "We've received your order and payment. We'll email you again when it's on its way.",
    paragraphs: [
      ...o.items.map((i) => `${i.quantity} × ${i.productName} (${i.colour}, ${i.size}) — ${formatPenceExact(i.unitPricePence * i.quantity)}`),
      `Delivery (${o.shippingMethodName}): ${o.shippingPence ? formatPenceExact(o.shippingPence) : "Free"}`,
      o.discountPence ? `Discount: −${formatPenceExact(o.discountPence)}` : "",
      `Total paid: ${formatPenceExact(o.totalPence)}`,
      "You can cancel within 14 days of receiving your goods. See our Returns & Refunds page for how.",
    ].filter(Boolean),
    cta: { label: "Track your order", url: url("/track-order") },
  });
  await sendEmail({
    to: o.email,
    subject: `Order confirmed — ${formatOrderNumber(o.orderNumber)}`,
    html,
    text,
    tags: { type: "order-confirmation" },
  });
}

export async function sendDispatchEmail(orderId: string, shipment: { carrier: string; trackingNumber?: string | null; trackingUrl?: string | null }) {
  const o = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  const { html, text } = await layout({
    title: "Your order is on its way",
    intro: `Good news — order ${formatOrderNumber(o.orderNumber)} has been dispatched with ${shipment.carrier}.`,
    paragraphs: [shipment.trackingNumber ? `Tracking number: ${shipment.trackingNumber}` : "", `Delivery method: ${o.shippingMethodName}`].filter(
      Boolean,
    ),
    cta: shipment.trackingUrl ? { label: "Track your parcel", url: shipment.trackingUrl } : { label: "View your order", url: url("/track-order") },
  });
  await sendEmail({ to: o.email, subject: `Dispatched — ${formatOrderNumber(o.orderNumber)}`, html, text, tags: { type: "order-dispatched" } });
}

export async function sendCancellationEmail(orderId: string, reason: string) {
  const o = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  const { html, text } = await layout({
    title: "Your order has been cancelled",
    intro: `Order ${formatOrderNumber(o.orderNumber)} has been cancelled.`,
    paragraphs: [
      reason ? `Reason: ${reason}` : "",
      "If you paid, your refund will be issued to your original payment method within 14 days. Please contact us with any questions.",
    ].filter(Boolean),
  });
  await sendEmail({ to: o.email, subject: `Order cancelled — ${formatOrderNumber(o.orderNumber)}`, html, text, tags: { type: "order-cancelled" } });
}
