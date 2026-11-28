import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { expire, TAGS } from "../cache";
import { buildView } from "../cart/cart";
import { db } from "../db";
import { computeTotals, type PricingResult } from "../pricing/pricing";
import { validateCoupon } from "../pricing/coupons";
import { getSettings } from "../settings";

/**
 * Order lifecycle with transaction-safe stock handling.
 *
 *   createPendingOrder  – re-prices the cart on the server, then in ONE transaction reserves
 *                          stock with conditional updates (fails if any line is short) and
 *                          creates the order + line snapshots. Reservation expires after N minutes.
 *   markOrderPaid       – called ONLY from the verified payment webhook (Stage 5). Converts
 *                          reservations into sales; idempotent.
 *   cancelPendingOrder  – payment failed/abandoned: releases reservations.
 *   releaseExpiredReservations – safety-net sweeper (cron).
 *   cancelPaidOrder     – admin cancellation, optional restock.
 *
 * Every stock change writes a StockMovement row, and DB CHECK constraints make overselling
 * impossible even if application code were wrong.
 */

export interface AddressInput {
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  county?: string | null;
  postcode: string;
  country: "GB";
  phone?: string | null;
}

export interface CheckoutInput {
  cartId: string;
  email: string;
  userId: string | null;
  shippingAddress: AddressInput;
  billingAddress: AddressInput;
  shippingCode: string;
  deliveryInstructions?: string | null;
  marketingOptIn: boolean;
}

export class CheckoutError extends Error {
  constructor(
    message: string,
    public code: "EMPTY" | "STOCK" | "UNAVAILABLE" | "SHIPPING" | "COUPON" = "STOCK",
  ) {
    super(message);
  }
}

/** Server-side quote for a cart: the ONLY numbers the checkout will ever charge. */
export async function quoteCart(cartId: string, opts: { shippingCode?: string | null; email?: string | null }) {
  await releaseExpiredReservationsSoon();
  const cart = await db.cart.findUniqueOrThrow({ where: { id: cartId } });
  const view = await buildView(cartId, cart.couponCode);
  const settings = await getSettings();
  const methods = await db.shippingMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const method = methods.find((m) => m.code === opts.shippingCode) ?? methods[0] ?? null;
  const sellable = view.lines.filter((l) => !l.issue);

  let couponNote: string | null = null;
  let coupon: { id: string; code: string; type: "PERCENT" | "FIXED" | "FREE_SHIPPING"; value: number } | null = null;
  if (cart.couponCode) {
    const check = await validateCoupon(cart.couponCode, { subtotalPence: view.subtotalPence, email: opts.email });
    if (check.ok) coupon = check.coupon;
    else couponNote = check.reason;
  }

  const totals: PricingResult = computeTotals({
    lines: sellable.map((l) => ({ key: l.variantId, unitPricePence: l.unitPricePence, quantity: l.quantity, taxRateBps: l.taxRateBps })),
    coupon,
    shipping: method ? { pricePence: method.pricePence, freeOverPence: method.freeOverPence } : null,
    vatRegistered: settings.tax.vatRegistered,
    shippingTaxRateBps: settings.tax.shippingTaxRateBps,
  });
  return { view, totals, method, methods, coupon, couponNote, blocking: view.lines.filter((l) => l.issue) };
}

export async function createPendingOrder(input: CheckoutInput) {
  const settings = await getSettings();
  const q = await quoteCart(input.cartId, { shippingCode: input.shippingCode, email: input.email });
  if (!q.view.lines.length) throw new CheckoutError("Your bag is empty.", "EMPTY");
  if (q.blocking.length) throw new CheckoutError(`${q.blocking[0].name}: ${q.blocking[0].issue}.`, "UNAVAILABLE");
  if (!q.method) throw new CheckoutError("Delivery is temporarily unavailable.", "SHIPPING");
  if (q.couponNote) throw new CheckoutError(q.couponNote, "COUPON");

  const expiresAt = new Date(Date.now() + settings.commerce.reservationMinutes * 60_000);
  const order = await db.$transaction(
    async (tx) => {
      // 1) Reserve stock atomically — the WHERE clause guarantees availability at write time.
      for (const l of q.view.lines) {
        const updated = await tx.$executeRaw`
          UPDATE "ProductVariant" SET "stockReserved" = "stockReserved" + ${l.quantity}, "updatedAt" = now()
          WHERE id = ${l.variantId} AND "isActive" = true AND "stockOnHand" - "stockReserved" >= ${l.quantity}`;
        if (updated !== 1)
          throw new CheckoutError(`Sorry — ${l.name} (${l.colour}, ${l.size}) has just sold out or has fewer left than you asked for.`, "STOCK");
      }
      // 2) Create the order with price snapshots.
      const created = await tx.order.create({
        data: {
          userId: input.userId,
          email: input.email.toLowerCase(),
          status: "PENDING_PAYMENT",
          shippingAddress: input.shippingAddress as unknown as Prisma.InputJsonValue,
          billingAddress: input.billingAddress as unknown as Prisma.InputJsonValue,
          deliveryInstructions: input.deliveryInstructions || null,
          subtotalPence: q.totals.subtotalPence,
          discountPence: q.totals.discountPence,
          shippingPence: q.totals.shippingPence,
          taxPence: q.totals.taxPence,
          totalPence: q.totals.totalPence,
          vatRegistered: settings.tax.vatRegistered,
          couponCode: q.coupon?.code ?? null,
          shippingMethodId: q.method!.id,
          shippingMethodName: q.method!.name,
          marketingOptIn: input.marketingOptIn,
          reservationExpiresAt: expiresAt,
          items: {
            create: q.view.lines.map((l) => ({
              variantId: l.variantId,
              productId: l.productId,
              productName: l.name,
              productSlug: l.productSlug,
              sku: "",
              size: l.size,
              colour: l.colour,
              unitPricePence: l.unitPricePence,
              quantity: l.quantity,
              taxRateBps: settings.tax.vatRegistered ? l.taxRateBps : 0,
              lineTotalPence: l.unitPricePence * l.quantity - (q.totals.lineDiscounts[l.variantId] ?? 0),
            })),
          },
        },
        include: { items: true },
      });
      // SKU snapshot + reservation ledger
      for (const it of created.items) {
        const v = await tx.productVariant.findUnique({ where: { id: it.variantId! }, select: { sku: true } });
        await tx.orderItem.update({ where: { id: it.id }, data: { sku: v?.sku ?? "" } });
        await tx.stockMovement.create({
          data: { variantId: it.variantId!, type: "RESERVE", quantity: it.quantity, orderId: created.id, reason: "Checkout started" },
        });
      }
      return created;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15000 },
  );
  expire(TAGS.products);
  return order;
}

/**
 * Mark an order paid. MUST only be called after the payment provider has confirmed payment
 * via a signature-verified webhook. Idempotent: repeated calls are no-ops.
 */
export async function markOrderPaid(orderId: string, payment: { providerPaymentId: string; amountPence: number; method?: string | null }) {
  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    if (order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED") return { order, changed: false, stockConflict: false };
    if (payment.amountPence !== order.totalPence)
      throw new Error(`Payment amount ${payment.amountPence} does not match order total ${order.totalPence}`);

    const wasReleased = order.status === "CANCELLED"; // reservation expired before payment completed
    let stockConflict = false;
    for (const it of order.items) {
      if (!it.variantId) continue;
      const n = wasReleased
        ? await tx.$executeRaw`UPDATE "ProductVariant" SET "stockOnHand" = "stockOnHand" - ${it.quantity}, "updatedAt" = now()
            WHERE id = ${it.variantId} AND "stockOnHand" - "stockReserved" >= ${it.quantity}`
        : await tx.$executeRaw`UPDATE "ProductVariant" SET "stockOnHand" = "stockOnHand" - ${it.quantity}, "stockReserved" = "stockReserved" - ${it.quantity}, "updatedAt" = now()
            WHERE id = ${it.variantId} AND "stockReserved" >= ${it.quantity}`;
      if (n !== 1) stockConflict = true;
      else
        await tx.stockMovement.create({
          data: { variantId: it.variantId, type: "SALE", quantity: -it.quantity, orderId: order.id, reason: "Order paid" },
        });
    }

    await tx.payment.upsert({
      where: { providerPaymentId: payment.providerPaymentId },
      create: {
        orderId: order.id,
        providerPaymentId: payment.providerPaymentId,
        status: "SUCCEEDED",
        amountPence: payment.amountPence,
        method: payment.method ?? null,
      },
      update: { status: "SUCCEEDED" },
    });

    if (order.couponCode) {
      const coupon = await tx.coupon.findUnique({ where: { code: order.couponCode } });
      if (coupon) {
        await tx.couponRedemption.upsert({
          where: { orderId: order.id },
          create: { couponId: coupon.id, orderId: order.id, email: order.email },
          update: {},
        });
        await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      }
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        placedAt: new Date(),
        cancelledAt: null,
        cancelReason: null,
        reservationExpiresAt: null,
        internalNotes: stockConflict
          ? `${order.internalNotes ?? ""}\n⚠ STOCK CONFLICT: payment succeeded after the reservation expired and some items were no longer in stock. Contact the customer (offer refund or wait for restock).`.trim()
          : order.internalNotes,
      },
    });

    // Empty the customer's bag now that the order is paid.
    if (order.userId) {
      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { order: updated, changed: true, stockConflict };
  });
  if (result.changed) expire(TAGS.products, TAGS.orders);
  return result;
}

/** Release reservations for an unpaid order (payment failed, abandoned or expired). */
export async function cancelPendingOrder(orderId: string, reason: string) {
  const changed = await db.$transaction(async (tx) => {
    // Lock-free guard: only one caller can flip PENDING_PAYMENT → CANCELLED.
    const flipped = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING_PAYMENT" },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason, reservationExpiresAt: null },
    });
    if (flipped.count !== 1) return false;
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const it of items) {
      if (!it.variantId) continue;
      await tx.$executeRaw`UPDATE "ProductVariant" SET "stockReserved" = GREATEST(0, "stockReserved" - ${it.quantity}), "updatedAt" = now() WHERE id = ${it.variantId}`;
      await tx.stockMovement.create({ data: { variantId: it.variantId, type: "RELEASE", quantity: it.quantity, orderId, reason } });
    }
    return true;
  });
  if (changed) expire(TAGS.products, TAGS.orders);
  return changed;
}

export async function releaseExpiredReservations(now = new Date()) {
  const expired = await db.order.findMany({ where: { status: "PENDING_PAYMENT", reservationExpiresAt: { lt: now } }, select: { id: true } });
  let released = 0;
  for (const o of expired) if (await cancelPendingOrder(o.id, "Payment not completed in time")) released++;
  return released;
}

/**
 * Opportunistic release of abandoned checkout holds, called as customers shop (bag, checkout, live
 * stock). Needed on hosting where the scheduled job runs only once a day (Vercel Hobby). Throttled to
 * one sweep per minute per server instance; never throws into the caller. Safe against late payments:
 * markOrderPaid still accepts a payment for a released order and flags any stock conflict.
 */
let lastSweep = 0;
export async function releaseExpiredReservationsSoon(now = Date.now()): Promise<number | null> {
  if (now - lastSweep < 60_000) return null;
  lastSweep = now;
  try {
    return await releaseExpiredReservations(new Date(now));
  } catch (e) {
    console.error("[orders] release sweep failed", e);
    return 0;
  }
}

/** Admin cancellation of a paid order. Refunds are issued separately via the payment provider. */
export async function cancelPaidOrder(orderId: string, opts: { reason: string; restock: boolean; actorId?: string }) {
  const changed = await db.$transaction(async (tx) => {
    const flipped = await tx.order.updateMany({
      where: { id: orderId, status: { in: ["PAID", "PROCESSING"] } },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: opts.reason },
    });
    if (flipped.count !== 1) return false;
    if (opts.restock) {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const it of items) {
        if (!it.variantId) continue;
        await tx.productVariant.update({ where: { id: it.variantId }, data: { stockOnHand: { increment: it.quantity } } });
        await tx.stockMovement.create({
          data: {
            variantId: it.variantId,
            type: "RETURN",
            quantity: it.quantity,
            orderId,
            reason: `Order cancelled: ${opts.reason}`,
            userId: opts.actorId,
          },
        });
      }
    }
    return true;
  });
  if (changed) expire(TAGS.products, TAGS.orders);
  return changed;
}
