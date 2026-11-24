import type Stripe from "stripe";
import { getStripe } from "@/server/payments/stripe";
import { handleStripeEvent } from "@/server/payments/webhook";

/**
 * POST /api/webhooks/stripe — the ONLY place that confirms payments.
 * The raw body is verified against STRIPE_WEBHOOK_SECRET; unsigned or tampered
 * requests are rejected before anything is read.
 *
 * Subscribe these events in Stripe Dashboard → Developers → Webhooks:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.async_payment_failed, checkout.session.expired,
 *   refund.created, refund.updated, refund.failed, charge.dispute.created
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret) return new Response("Webhook secret not configured", { status: 500 });
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(body, signature, secret, 300);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  try {
    const result = await handleStripeEvent(event);
    return Response.json({ received: true, result });
  } catch (e) {
    console.error(`[stripe webhook] ${event.type} ${event.id} failed:`, e);
    return new Response("Processing failed — Stripe will retry", { status: 500 });
  }
}
