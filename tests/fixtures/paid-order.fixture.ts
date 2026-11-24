/**
 * E2E FIXTURE (development database only): creates an order through the real checkout
 * service and confirms it exactly as the verified payment webhook will in Stage 5, so the
 * admin fulfilment, tracking, invoice and review flows can be tested end-to-end.
 * This is test tooling — it is never bundled into the application.
 *
 *   FIXTURE_EMAIL=… FIXTURE_USER_ID=… npx vitest run tests/fixtures
 */
import { it } from "vitest";
import { db } from "@/server/db";
import { createPendingOrder, markOrderPaid } from "@/server/orders/orders";

it("creates a paid order for E2E tests", async () => {
  if (process.env.NODE_ENV === "production" || !process.env.FIXTURE_EMAIL) return;
  const variant = await db.productVariant.findFirstOrThrow({ where: { product: { slug: "palpa-dhaka-trim-maxi-dress" }, stockOnHand: { gt: 3 } } });
  const cart = await db.cart.create({ data: { token: `fixture-${Date.now()}`, items: { create: { variantId: variant.id, quantity: 1 } } } });
  const address = { fullName: "E2E Customer", line1: "10 Downing Street", city: "London", postcode: "SW1A 2AA", country: "GB" as const };
  const order = await createPendingOrder({
    cartId: cart.id,
    email: process.env.FIXTURE_EMAIL,
    userId: process.env.FIXTURE_USER_ID || null,
    shippingAddress: address,
    billingAddress: address,
    shippingCode: "uk-standard",
    marketingOptIn: false,
  });
  await markOrderPaid(order.id, { providerPaymentId: `fixture_${order.id}`, amountPence: order.totalPence, method: "test-fixture" });
  await db.cart.delete({ where: { id: cart.id } });
  console.log(`FIXTURE_ORDER=${order.id} WM-${10000 + order.orderNumber}`);
}, 30000);
