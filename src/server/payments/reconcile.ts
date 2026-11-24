import "server-only";
import { db } from "../db";
import { sendNewOrderAlert, sendOrderConfirmation } from "../orders/notifications";
import { cancelPendingOrder, markOrderPaid } from "../orders/orders";
import { getStripe, isStripeConfigured } from "./stripe";

/**
 * Safety net for missed webhooks: asks Stripe directly (server-to-server, with our secret key)
 * for the true state of a pending order's Checkout Session. Never trusts the browser.
 */
export async function reconcileOrder(orderId: string): Promise<"paid" | "cancelled" | "pending" | "skipped"> {
  if (!isStripeConfigured()) return "skipped";
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order?.stripeCheckoutSessionId || order.status !== "PENDING_PAYMENT") return "skipped";
  const s = await getStripe().checkout.sessions.retrieve(order.stripeCheckoutSessionId);
  if (s.status === "complete" && (s.payment_status === "paid" || s.payment_status === "no_payment_required")) {
    const pi = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
    if (!pi) return "pending";
    const r = await markOrderPaid(order.id, {
      providerPaymentId: pi,
      amountPence: s.amount_total ?? -1,
      method: s.payment_method_types?.[0] ?? null,
    });
    if (r.changed) {
      await sendOrderConfirmation(order.id).catch(() => {});
      await sendNewOrderAlert(order.id, r.stockConflict).catch(() => {});
    }
    return "paid";
  }
  if (s.status === "expired") {
    await cancelPendingOrder(order.id, "Checkout expired without payment");
    return "cancelled";
  }
  return "pending";
}

/** Reconcile pending orders older than 10 minutes (run from the cron job). */
export async function reconcilePendingOrders() {
  if (!isStripeConfigured()) return 0;
  const stale = await db.order.findMany({
    where: { status: "PENDING_PAYMENT", stripeCheckoutSessionId: { not: null }, createdAt: { lt: new Date(Date.now() - 10 * 60_000) } },
    select: { id: true },
    take: 50,
  });
  let changed = 0;
  for (const o of stale) if ((await reconcileOrder(o.id).catch(() => "pending")) !== "pending") changed++;
  return changed;
}
