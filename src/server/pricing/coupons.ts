import "server-only";
import { db } from "../db";
import type { PricingCoupon } from "./pricing";

export type CouponCheck = { ok: true; coupon: PricingCoupon & { id: string } } | { ok: false; reason: string };

/**
 * Server-side coupon validation. Every rule is enforced here — the browser only sends a code.
 * The usage count is re-checked inside the payment transaction to prevent races.
 */
export async function validateCoupon(rawCode: string, ctx: { subtotalPence: number; email?: string | null }): Promise<CouponCheck> {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,32}$/.test(code)) return { ok: false, reason: "That code isn't valid." };
  const c = await db.coupon.findUnique({ where: { code } });
  const now = new Date();
  if (!c || !c.isActive) return { ok: false, reason: "That code isn't valid." };
  if (c.startsAt && c.startsAt > now) return { ok: false, reason: "That code isn't active yet." };
  if (c.endsAt && c.endsAt < now) return { ok: false, reason: "That code has expired." };
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return { ok: false, reason: "That code has reached its usage limit." };
  if (ctx.subtotalPence < c.minSubtotalPence)
    return { ok: false, reason: `Spend £${(c.minSubtotalPence / 100).toFixed(2)} or more to use this code.` };
  if (ctx.email) {
    const email = ctx.email.toLowerCase();
    if (c.perCustomerLimit !== null) {
      const used = await db.couponRedemption.count({ where: { couponId: c.id, email } });
      if (used >= c.perCustomerLimit) return { ok: false, reason: "You've already used this code." };
    }
    if (c.firstOrderOnly) {
      const prior = await db.order.count({ where: { email, status: { in: ["PAID", "PROCESSING", "DISPATCHED", "DELIVERED"] } } });
      if (prior > 0) return { ok: false, reason: "This code is for first orders only." };
    }
  }
  return { ok: true, coupon: { id: c.id, code: c.code, type: c.type, value: c.value } };
}
