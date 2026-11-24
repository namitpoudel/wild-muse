import "server-only";
import type Stripe from "stripe";
import { db } from "../db";
import { sendNewOrderAlert, sendOrderConfirmation } from "../orders/notifications";
import { cancelPendingOrder, markOrderPaid } from "../orders/orders";
import { applyRefundStatus } from "./refunds";

/**
 * Stripe webhook processing. The route verifies the signature first (route.ts);
 * this function then applies the event exactly once (ProcessedWebhookEvent is unique
 * per event id). Throwing makes the route return 500 so Stripe retries later.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<"processed" | "duplicate" | "ignored"> {
  const seen = await db.processedWebhookEvent.findUnique({ where: { provider_eventId: { provider: "stripe", eventId: event.id } } });
  if (seen) return "duplicate";

  let handled = true;
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.payment_status === "paid" || s.payment_status === "no_payment_required") await fulfil(s);
      // "unpaid" = delayed payment method (e.g. bank debit): wait for async_payment_succeeded.
      break;
    }
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      const s = event.data.object as Stripe.Checkout.Session;
      const orderId = s.metadata?.orderId ?? s.client_reference_id;
      if (orderId)
        await cancelPendingOrder(orderId, event.type === "checkout.session.expired" ? "Checkout expired without payment" : "Payment failed");
      break;
    }
    case "refund.created":
    case "refund.updated":
    case "refund.failed": {
      const r = event.data.object as Stripe.Refund;
      await applyRefundStatus(r);
      break;
    }
    case "charge.dispute.created": {
      const d = event.data.object as Stripe.Dispute;
      const pi = typeof d.payment_intent === "string" ? d.payment_intent : d.payment_intent?.id;
      const payment = pi ? await db.payment.findUnique({ where: { providerPaymentId: pi } }) : null;
      if (payment) {
        const o = await db.order.findUniqueOrThrow({ where: { id: payment.orderId } });
        await db.order.update({
          where: { id: o.id },
          data: {
            internalNotes:
              `${o.internalNotes ?? ""}\n⚠ CHARGEBACK opened (${d.reason}) — respond in the Stripe Dashboard before the deadline.`.trim(),
          },
        });
      }
      break;
    }
    default:
      handled = false;
  }
  await db.processedWebhookEvent.create({ data: { provider: "stripe", eventId: event.id } }).catch(() => {});
  return handled ? "processed" : "ignored";
}

async function fulfil(s: Stripe.Checkout.Session) {
  const orderId = s.metadata?.orderId ?? s.client_reference_id;
  if (!orderId) throw new Error(`Checkout session ${s.id} has no order id`);
  const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
  if (!pi) throw new Error(`Checkout session ${s.id} has no payment intent`);
  const result = await markOrderPaid(orderId, {
    providerPaymentId: pi,
    amountPence: s.amount_total ?? -1,
    method: s.payment_method_types?.[0] ?? null,
  });
  if (result.changed) {
    await sendOrderConfirmation(orderId).catch((e) => console.error("[webhook] confirmation email failed", e));
    await sendNewOrderAlert(orderId, result.stockConflict).catch((e) => console.error("[webhook] admin alert failed", e));
  }
}
