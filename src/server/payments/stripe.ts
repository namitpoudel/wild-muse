import "server-only";
import Stripe from "stripe";
import { siteConfig } from "@/config/site";
import { db } from "../db";
import { formatOrderNumber } from "../orders/format";

/**
 * Stripe integration (Checkout Sessions).
 *
 * - Card details never touch our servers: customers pay on Stripe's hosted page
 *   (PCI DSS SAQ-A). Apple Pay, Google Pay, Klarna and PayPal appear automatically
 *   when enabled in the Stripe Dashboard (Settings → Payment methods).
 * - Every amount comes from our server-side order (prices re-calculated, stock reserved).
 * - An order is marked PAID only by the signature-verified webhook (see webhook.ts).
 */
let client: Stripe | null = null;

export function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  // Fetch-based client: works on Vercel/Node and honours outbound proxy settings.
  client ??= new Stripe(key, { maxNetworkRetries: 2, timeout: 20_000, appInfo: { name: "Wild Muse" }, httpClient: Stripe.createFetchHttpClient() });
  return client;
}

const abs = (path: string) => new URL(path, siteConfig.url).toString();

/** Create the hosted Checkout page for a PENDING_PAYMENT order. Idempotent per order. */
export async function createCheckoutSession(orderId: string) {
  const stripe = getStripe();
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  if (order.status !== "PENDING_PAYMENT") throw new Error("Order is not awaiting payment");

  // Stripe requires expiry between 30 minutes and 24 hours from now.
  const minExpiry = Date.now() + 31 * 60_000;
  const expiresAt = Math.floor(Math.max(order.reservationExpiresAt?.getTime() ?? minExpiry, minExpiry) / 1000);
  if (order.reservationExpiresAt && order.reservationExpiresAt.getTime() < expiresAt * 1000) {
    // Keep our stock hold at least as long as the payment page is open.
    await db.order.update({ where: { id: order.id }, data: { reservationExpiresAt: new Date(expiresAt * 1000 + 5 * 60_000) } });
  }

  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (order.discountPence > 0) {
    const coupon = await stripe.coupons.create(
      {
        amount_off: order.discountPence,
        currency: "gbp",
        duration: "once",
        max_redemptions: 1,
        name: order.couponCode ? `Code ${order.couponCode}` : "Discount",
        metadata: { orderId: order.id },
      },
      { idempotencyKey: `coupon-${order.id}` },
    );
    discounts = [{ coupon: coupon.id }];
  }

  const ref = formatOrderNumber(order.orderNumber);
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      currency: "gbp",
      locale: "en-GB",
      customer_email: order.email,
      client_reference_id: order.id,
      expires_at: expiresAt,
      line_items: order.items.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency: "gbp",
          unit_amount: i.unitPricePence,
          product_data: { name: i.productName, description: `${i.colour} · ${i.size}`, metadata: { sku: i.sku } },
        },
      })),
      discounts,
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: order.shippingMethodName,
            fixed_amount: { amount: order.shippingPence, currency: "gbp" },
          },
        },
      ],
      metadata: { orderId: order.id, orderRef: ref },
      payment_intent_data: { metadata: { orderId: order.id, orderRef: ref }, description: `Wild Muse order ${ref}` },
      success_url: abs(`/checkout/success?session_id={CHECKOUT_SESSION_ID}`),
      cancel_url: abs(`/checkout/cancelled?session_id={CHECKOUT_SESSION_ID}`),
    },
    { idempotencyKey: `checkout-${order.id}` },
  );
  await db.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: session.id } });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  if (session.amount_total !== null && session.amount_total !== order.totalPence) {
    // Should never happen — abort rather than charge a different amount.
    await stripe.checkout.sessions.expire(session.id).catch(() => {});
    throw new Error(`Stripe total ${session.amount_total} != order total ${order.totalPence}`);
  }
  return session.url;
}

/** Customer came back from Stripe without paying: close the session so stock is released promptly. */
export async function expireCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.status === "open") await stripe.checkout.sessions.expire(sessionId);
  return session;
}

/** Issue a refund through Stripe (money really moves). Idempotent per refund record. */
export async function createStripeRefund(opts: {
  paymentIntentId: string;
  amountPence: number;
  refundId: string;
  orderId: string;
  reason?: Stripe.RefundCreateParams.Reason;
}) {
  return getStripe().refunds.create(
    {
      payment_intent: opts.paymentIntentId,
      amount: opts.amountPence,
      reason: opts.reason,
      metadata: { orderId: opts.orderId, refundId: opts.refundId },
    },
    { idempotencyKey: `refund-${opts.refundId}` },
  );
}
