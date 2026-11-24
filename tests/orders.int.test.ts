/**
 * Integration tests for transaction-safe order processing against a real PostgreSQL database.
 * Requires DATABASE_URL (local dev DB). Creates its own fixtures and removes them afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { cancelPendingOrder, CheckoutError, createPendingOrder, markOrderPaid, releaseExpiredReservations } from "@/server/orders/orders";

const TAG = `it-${Date.now()}`;
let variantId = "";
let productId = "";
const address = { fullName: "Test Customer", line1: "1 Test Street", city: "London", postcode: "SW1A 1AA", country: "GB" as const };

async function cartWith(qty: number) {
  const cart = await db.cart.create({ data: { token: `${TAG}-${Math.random()}` } });
  await db.cartItem.create({ data: { cartId: cart.id, variantId, quantity: qty } });
  return cart.id;
}
const checkout = (cartId: string) =>
  createPendingOrder({ cartId, email: `${TAG}@example.com`, userId: null, shippingAddress: address, billingAddress: address, shippingCode: "uk-standard", marketingOptIn: false });
const variant = () => db.productVariant.findUniqueOrThrow({ where: { id: variantId } });

beforeAll(async () => {
  const category = await db.category.findFirstOrThrow();
  const p = await db.product.create({
    data: {
      slug: TAG,
      name: "Integration Test Scarf",
      department: "ACCESSORIES",
      categoryId: category.id,
      status: "PUBLISHED",
      shortDescription: "test",
      description: "test",
      pricePence: 2500,
      fibreComposition: "100% cotton",
      materials: "cotton",
      care: [],
      variants: { create: [{ sku: TAG, size: "One size", colour: "Sand", stockOnHand: 1 }] },
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
  await db.$disconnect();
});

describe("order processing", () => {
  it("never oversells: two simultaneous checkouts for the last unit → exactly one succeeds", async () => {
    const [a, b] = await Promise.all([cartWith(1), cartWith(1)]);
    const results = await Promise.allSettled([checkout(a), checkout(b)]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0].reason).toBeInstanceOf(CheckoutError);
    expect(await variant()).toMatchObject({ stockOnHand: 1, stockReserved: 1 });

    const order = (ok[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof checkout>>>).value;
    expect(order.status).toBe("PENDING_PAYMENT");
    expect(order.subtotalPence).toBe(2500);
    expect(order.shippingPence).toBe(395); // below £75 threshold
    expect(order.totalPence).toBe(2895);

    // Payment confirmed (as the verified webhook would do) → reservation becomes a sale.
    const paid = await markOrderPaid(order.id, { providerPaymentId: `${TAG}-pi-1`, amountPence: 2895, method: "card" });
    expect(paid.changed).toBe(true);
    expect(await variant()).toMatchObject({ stockOnHand: 0, stockReserved: 0 });

    // Webhooks can be delivered twice — second call must be a no-op.
    const again = await markOrderPaid(order.id, { providerPaymentId: `${TAG}-pi-1`, amountPence: 2895 });
    expect(again.changed).toBe(false);
    expect(await variant()).toMatchObject({ stockOnHand: 0, stockReserved: 0 });
    const movements = await db.stockMovement.findMany({ where: { variantId }, orderBy: { createdAt: "asc" } });
    expect(movements.map((m) => m.type)).toEqual(["RESERVE", "SALE"]);
  });

  it("rejects a payment whose amount doesn't match the order total", async () => {
    await db.productVariant.update({ where: { id: variantId }, data: { stockOnHand: 2 } });
    const order = await checkout(await cartWith(1));
    await expect(markOrderPaid(order.id, { providerPaymentId: `${TAG}-pi-bad`, amountPence: 1 })).rejects.toThrow(/does not match/);
    await cancelPendingOrder(order.id, "test cleanup");
  });

  it("releases reserved stock when payment fails or expires", async () => {
    const order = await checkout(await cartWith(2));
    expect(await variant()).toMatchObject({ stockOnHand: 2, stockReserved: 2 });
    await db.order.update({ where: { id: order.id }, data: { reservationExpiresAt: new Date(Date.now() - 1000) } });
    expect(await releaseExpiredReservations()).toBeGreaterThanOrEqual(1);
    expect(await variant()).toMatchObject({ stockOnHand: 2, stockReserved: 0 });
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CANCELLED");
    // Releasing twice must not double-release.
    expect(await cancelPendingOrder(order.id, "again")).toBe(false);
    expect(await variant()).toMatchObject({ stockReserved: 0 });
  });

  it("refuses checkout when the requested quantity exceeds stock", async () => {
    await expect(checkout(await cartWith(3))).rejects.toThrow(/Only 2 available|sold out|fewer left/);
  });

  it("database constraints block negative stock even if code is wrong", async () => {
    await expect(db.productVariant.update({ where: { id: variantId }, data: { stockOnHand: -1 } })).rejects.toThrow();
  });
});
