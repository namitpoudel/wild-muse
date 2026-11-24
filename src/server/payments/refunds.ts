import "server-only";
import type Stripe from "stripe";
import { expire, TAGS } from "../cache";
import { db } from "../db";
import { sendRefundEmail } from "../orders/notifications";
import { createStripeRefund } from "./stripe";

/**
 * Refunds are issued through Stripe so money really moves. We record a Refund row first
 * (its id is the Stripe idempotency key), then update it from Stripe's response and from
 * refund webhooks. Order status becomes REFUNDED / PARTIALLY_REFUNDED when Stripe confirms.
 */
export class RefundError extends Error {}

export async function refundOrder(opts: { orderId: string; amountPence: number; reason: string; restock: boolean; actorId: string }) {
  const order = await db.order.findUnique({ where: { id: opts.orderId }, include: { payments: true, refunds: true, items: true } });
  if (!order) throw new RefundError("Order not found.");
  const payment = order.payments.find((p) => p.status === "SUCCEEDED" || p.status === "PARTIALLY_REFUNDED");
  if (!payment) throw new RefundError("There's no successful payment to refund.");
  const already = order.refunds.filter((r) => r.status !== "FAILED").reduce((n, r) => n + r.amountPence, 0);
  const remaining = order.totalPence - already;
  if (opts.amountPence <= 0 || opts.amountPence > remaining) throw new RefundError(`You can refund up to £${(remaining / 100).toFixed(2)}.`);

  const refund = await db.refund.create({
    data: { orderId: order.id, amountPence: opts.amountPence, reason: opts.reason, status: "PENDING", restocked: false, createdById: opts.actorId },
  });
  let stripeRefund: Stripe.Refund;
  try {
    stripeRefund = await createStripeRefund({
      paymentIntentId: payment.providerPaymentId,
      amountPence: opts.amountPence,
      refundId: refund.id,
      orderId: order.id,
      reason: "requested_by_customer",
    });
  } catch (e) {
    await db.refund.update({ where: { id: refund.id }, data: { status: "FAILED" } });
    throw new RefundError(`Stripe refused the refund: ${(e as Error).message}`);
  }
  await db.refund.update({ where: { id: refund.id }, data: { providerRefundId: stripeRefund.id } });
  await applyRefundStatus(stripeRefund);

  // Restock everything on a full refund when requested (partial refunds: adjust stock in Inventory).
  if (opts.restock && opts.amountPence === remaining) {
    await db.$transaction(async (tx) => {
      for (const it of order.items) {
        const back = it.quantity - it.refundedQuantity;
        if (!it.variantId || back <= 0) continue;
        await tx.productVariant.update({ where: { id: it.variantId }, data: { stockOnHand: { increment: back } } });
        await tx.orderItem.update({ where: { id: it.id }, data: { refundedQuantity: it.quantity } });
        await tx.stockMovement.create({
          data: {
            variantId: it.variantId,
            type: "RETURN",
            quantity: back,
            orderId: order.id,
            reason: `Refund: ${opts.reason}`,
            userId: opts.actorId,
          },
        });
      }
      await tx.refund.update({ where: { id: refund.id }, data: { restocked: true } });
    });
    expire(TAGS.products);
  }
  return db.refund.findUniqueOrThrow({ where: { id: refund.id } });
}

/** Sync a refund's status from a Stripe Refund object (API response or webhook). */
export async function applyRefundStatus(r: Stripe.Refund) {
  const refundId = r.metadata?.refundId;
  const local =
    (refundId && (await db.refund.findUnique({ where: { id: refundId } }))) || (await db.refund.findUnique({ where: { providerRefundId: r.id } }));
  if (!local) return; // refund made directly in the Stripe Dashboard — recorded by the admin if needed
  const status = r.status === "succeeded" ? "SUCCEEDED" : r.status === "failed" || r.status === "canceled" ? "FAILED" : "PENDING";
  const wasSucceeded = local.status === "SUCCEEDED";
  await db.refund.update({ where: { id: local.id }, data: { status, providerRefundId: r.id } });
  if (status === "SUCCEEDED" && !wasSucceeded) {
    const order = await db.order.findUniqueOrThrow({ where: { id: local.orderId }, include: { refunds: true } });
    const refunded = order.refunds.filter((x) => x.status === "SUCCEEDED").reduce((n, x) => n + x.amountPence, 0);
    const full = refunded >= order.totalPence;
    await db.order.update({ where: { id: order.id }, data: { status: full ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
    await db.payment.updateMany({
      where: { orderId: order.id, status: { in: ["SUCCEEDED", "PARTIALLY_REFUNDED"] } },
      data: { status: full ? "REFUNDED" : "PARTIALLY_REFUNDED" },
    });
    await sendRefundEmail(order.id, local.amountPence).catch((e) => console.error("[refund] email failed", e));
    expire(TAGS.orders);
  }
}
