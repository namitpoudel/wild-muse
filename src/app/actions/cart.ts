"use server";

import { z } from "zod";
import { addToCart, CartError, getCartView, setCartCoupon, setQuantity, type CartView } from "@/server/cart/cart";
import { releaseExpiredReservationsSoon } from "@/server/orders/orders";
import { validateCoupon } from "@/server/pricing/coupons";
import { rateLimit } from "@/server/security/rate-limit";
import { fail, ok, type ActionResult } from "./result";

const variantId = z.string().min(1).max(64);
const qty = z.number().int().min(0).max(20);

export async function getCartAction(): Promise<CartView> {
  return getCartView();
}

export async function addToCartAction(input: { variantId: string; quantity: number }): Promise<ActionResult<{ cart: CartView; capped: boolean }>> {
  const parsed = z.object({ variantId, quantity: qty.min(1) }).safeParse(input);
  if (!parsed.success) return fail("Invalid request.");
  const rl = await rateLimit("cart", { max: 60, windowSeconds: 60 });
  if (!rl.ok) return fail("You're doing that too quickly — please wait a moment.");
  await releaseExpiredReservationsSoon();
  try {
    const { view, capped } = await addToCart(parsed.data.variantId, parsed.data.quantity);
    return ok({ cart: view, capped });
  } catch (e) {
    if (e instanceof CartError) return fail(e.message);
    console.error(e);
    return fail("We couldn't update your bag. Please try again.");
  }
}

export async function updateCartLineAction(input: { variantId: string; quantity: number }): Promise<ActionResult<CartView>> {
  const parsed = z.object({ variantId, quantity: qty }).safeParse(input);
  if (!parsed.success) return fail("Invalid request.");
  try {
    return ok(await setQuantity(parsed.data.variantId, parsed.data.quantity));
  } catch (e) {
    console.error(e);
    return fail("We couldn't update your bag. Please try again.");
  }
}

export async function applyCouponAction(input: { code: string; email?: string }): Promise<ActionResult<CartView>> {
  const parsed = z.object({ code: z.string().trim().min(1).max(32), email: z.email().optional().or(z.literal("")) }).safeParse(input);
  if (!parsed.success) return fail("Enter a discount code.");
  const rl = await rateLimit("coupon", { max: 10, windowSeconds: 300 });
  if (!rl.ok) return fail("Too many attempts — please try again in a few minutes.");
  const cart = await getCartView();
  const check = await validateCoupon(parsed.data.code, { subtotalPence: cart.subtotalPence, email: parsed.data.email || null });
  if (!check.ok) return fail(check.reason);
  return ok(await setCartCoupon(check.coupon.code), `Code ${check.coupon.code} applied`);
}

export async function removeCouponAction(): Promise<ActionResult<CartView>> {
  return ok(await setCartCoupon(null));
}
