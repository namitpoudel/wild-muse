/**
 * Stripe webhook integration tests: real signed payloads → real route handler → real database.
 * No network calls (signature verification is local; refunds use the Refund API object shape).
 */
import Stripe from "stripe";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.STRIPE_SECRET_KEY = "sk_test_dummy_for_signature_checks";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_wild_muse";
process.env.EMAIL_DRIVER = "console";

const { POST } = await import("@/app/api/webhooks/stripe/route");
const { db } = await import("@/server/db");
const { createPendingOrder } = await import("@/server/orders/orders");
const { getConsoleOutbox } = await import("@/server/email");

const stripe = new Stripe("sk_test_dummy_for_signature_checks");
const TAG = `wh-${Date.now()}`;
let variantId = "";
let productId = "";
const address = { fullName: "Webhook Test", line1: "1 Test St", city: "York", postcode: "YO1 7HH", country: "GB" as const };

function send(event: object, opts: { secret?: string; tamper?: boolean } = {}) {
  const payload = JSON.stringify(event);
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: opts.secret ?? process.env.STRIPE_WEBHOOK_SECRET! });
  return POST(
    new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: opts.tamper ? payload.replace("paid", "PAID") : payload,
      headers: { "stripe-signature": header },
    }),
  );
}
const evt = (type: string, object: object, id = `evt_${TAG}_${Math.random().toString(36).slice(2)}`) => ({
  id,
  object: "event",
  type,
  api_version: "2026-11-18",
  created: Math.floor(Date.now() / 1000),
  data: { object },
  livemode: false,
  pending_webhooks: 1,
  request: null,
});
const session = (orderId: string, extra: object = {}) => ({
  id: `cs_test_${orderId}`,
  object: "checkout.session",
  status: "complete",
  payment_status: "paid",
  amount_total: 0,
  payment_intent: `pi_test_${orderId}`,
  metadata: { orderId },
  client_reference_id: orderId,
  payment_method_types: ["card"],
  ...extra,
});

async function newOrder(qty = 1) {
  const cart = await db.cart.create({ data: { token: `${TAG}-${Math.random()}`, items: { create: { variantId, quantity: qty } } } });
  const o = await createPendingOrder({
    cartId: cart.id,
    email: `${TAG}@example.com`,
    userId: null,
    shippingAddress: address,
    billingAddress: address,
    shippingCode: "uk-standard",
    marketingOptIn: false,
  });
  await db.order.update({ where: { id: o.id }, data: { stripeCheckoutSessionId: `cs_test_${o.id}` } });
  return o;
}
const variant = () => db.productVariant.findUniqueOrThrow({ where: { id: variantId } });

beforeAll(async () => {
  const category = await db.category.findFirstOrThrow();
  const p = await db.product.create({
    data: {
      slug: TAG,
      name: "Webhook Test Bag",
      department: "ACCESSORIES",
      categoryId: category.id,
      status: "PUBLISHED",
      shortDescription: "t",
      description: "t",
      pricePence: 3000,
      fibreComposition: "100% hemp",
      materials: "hemp",
      care: [],
      variants: { create: [{ sku: TAG, size: "One size", colour: "Natural", stockOnHand: 50 }] },
    },
    include: { variants: true },
  });
  productId = p.id;
  variantId = p.variants[0].id;
});

afterAll(async () => {
  await db.order.deleteMany({ where: { email: `${TAG}@example.com` } });
  await db.cart.deleteMany({ where: { token: { startsWith: TAG } } });
  await db.product.delete({ where: { id: productId } });
  await db.processedWebhookEvent.deleteMany({ where: { eventId: { startsWith: `evt_${TAG}` } } });
  await db.$disconnect();
});

describe("Stripe webhook", () => {
  it("rejects requests without a valid signature", async () => {
    const o = await newOrder();
    const e = evt("checkout.session.completed", session(o.id, { amount_total: o.totalPence }));
    expect((await send(e, { secret: "whsec_wrong" })).status).toBe(400);
    expect((await send(e, { tamper: true })).status).toBe(400);
    const noSig = await POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", body: JSON.stringify(e) }));
    expect(noSig.status).toBe(400);
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("PENDING_PAYMENT");
  });

  it("marks the order paid once, converts the reservation to a sale and sends emails", async () => {
    const o = await newOrder(2);
    const before = await variant();
    const outbox = getConsoleOutbox().length;
    const e = evt("checkout.session.completed", session(o.id, { amount_total: o.totalPence }));
    const res = await send(e);
    expect(res.status).toBe(200);
    const paid = await db.order.findUniqueOrThrow({ where: { id: o.id }, include: { payments: true } });
    expect(paid.status).toBe("PAID");
    expect(paid.payments[0]).toMatchObject({ providerPaymentId: `pi_test_${o.id}`, amountPence: o.totalPence, status: "SUCCEEDED" });
    expect(await variant()).toMatchObject({ stockOnHand: before.stockOnHand - 2, stockReserved: before.stockReserved - 2 });
    const subjects = getConsoleOutbox()
      .slice(outbox)
      .map((m) => m.subject);
    expect(subjects.some((s) => s.startsWith("Order confirmed"))).toBe(true);
    expect(subjects.some((s) => s.startsWith("New order"))).toBe(true);

    // Stripe retries / duplicates must not double-count.
    const again = await send(e);
    expect(await again.json()).toMatchObject({ result: "duplicate" });
    const resent = await send({ ...e, id: `${e.id}_b` });
    expect(resent.status).toBe(200);
    expect(await variant()).toMatchObject({ stockOnHand: before.stockOnHand - 2 });
  });

  it("refuses to mark paid when the amount doesn't match (returns 500 so Stripe retries)", async () => {
    const o = await newOrder();
    const res = await send(evt("checkout.session.completed", session(o.id, { amount_total: 1 })));
    expect(res.status).toBe(500);
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("PENDING_PAYMENT");
  });

  it("waits for delayed payment methods (payment_status unpaid)", async () => {
    const o = await newOrder();
    await send(evt("checkout.session.completed", session(o.id, { amount_total: o.totalPence, payment_status: "unpaid" })));
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("PENDING_PAYMENT");
    await send(evt("checkout.session.async_payment_succeeded", session(o.id, { amount_total: o.totalPence })));
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("PAID");
  });

  it("releases reserved stock when the checkout expires", async () => {
    const before = await variant();
    const o = await newOrder();
    expect((await variant()).stockReserved).toBe(before.stockReserved + 1);
    await send(evt("checkout.session.expired", session(o.id, { status: "expired", payment_status: "unpaid" })));
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("CANCELLED");
    expect((await variant()).stockReserved).toBe(before.stockReserved);
  });

  it("applies refund confirmations and emails the customer", async () => {
    const o = await newOrder();
    await send(evt("checkout.session.completed", session(o.id, { amount_total: o.totalPence })));
    const refund = await db.refund.create({ data: { orderId: o.id, amountPence: o.totalPence, reason: "test", status: "PENDING" } });
    const outbox = getConsoleOutbox().length;
    await send(
      evt("refund.updated", {
        id: `re_${TAG}`,
        object: "refund",
        status: "succeeded",
        amount: o.totalPence,
        metadata: { refundId: refund.id, orderId: o.id },
      }),
    );
    expect((await db.order.findUniqueOrThrow({ where: { id: o.id } })).status).toBe("REFUNDED");
    expect((await db.refund.findUniqueOrThrow({ where: { id: refund.id } })).status).toBe("SUCCEEDED");
    expect(
      getConsoleOutbox()
        .slice(outbox)
        .some((m) => m.subject.startsWith("Refund processed")),
    ).toBe(true);
  });
});
