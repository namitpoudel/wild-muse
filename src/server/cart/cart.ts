import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { MediaAsset } from "@/lib/catalog/types";
import { getCurrentUser } from "../auth/session";
import { mapProduct, productInclude } from "../catalog/queries";
import { db } from "../db";

/**
 * Server-side cart. Guests are identified by a random token in an httpOnly cookie;
 * signed-in customers by user id (so the bag follows them across devices). When a guest
 * signs in, their guest bag is merged into their account bag.
 *
 * Prices and availability are ALWAYS read fresh from the database — nothing about price
 * or stock is ever accepted from the browser.
 */
export const CART_COOKIE = "wm_cart";
const MAX_QTY = 20;

export interface CartLineView {
  variantId: string;
  productSlug: string;
  name: string;
  size: string;
  colour: string;
  unitPricePence: number;
  compareAtPence?: number;
  image: MediaAsset;
  quantity: number;
  maxQuantity: number;
  taxRateBps: number;
  productId: string;
  /** Set when the line can no longer be bought as-is (sold out / unpublished / reduced). */
  issue?: string;
}

export interface CartView {
  lines: CartLineView[];
  itemCount: number;
  subtotalPence: number;
  couponCode: string | null;
}

async function readToken() {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

async function setToken(token: string | null) {
  const jar = await cookies();
  if (!token) jar.delete(CART_COOKIE);
  else
    jar.set(CART_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 60,
    });
}

/** Find (and optionally create) the current cart, merging a guest cart into the user's on sign-in. */
async function resolveCart(create: boolean) {
  const user = await getCurrentUser();
  const token = await readToken();
  const guest = token ? await db.cart.findUnique({ where: { token }, include: { items: true } }) : null;

  if (user) {
    let cart = await db.cart.findUnique({ where: { userId: user.id } });
    if (guest && guest.userId !== user.id) {
      if (!cart) {
        // Adopt the guest cart.
        cart = await db.cart.update({ where: { id: guest.id }, data: { userId: user.id, token: null } });
      } else {
        await db.$transaction(async (tx) => {
          for (const it of guest.items) {
            const existing = await tx.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart!.id, variantId: it.variantId } } });
            if (existing)
              await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: Math.min(MAX_QTY, existing.quantity + it.quantity) } });
            else await tx.cartItem.create({ data: { cartId: cart!.id, variantId: it.variantId, quantity: it.quantity } });
          }
          await tx.cart.delete({ where: { id: guest.id } });
        });
      }
      await setToken(null);
    }
    if (!cart && create) cart = await db.cart.create({ data: { userId: user.id } });
    return cart;
  }

  if (guest) return guest;
  if (!create) return null;
  const newToken = randomBytes(24).toString("base64url");
  const cart = await db.cart.create({ data: { token: newToken } });
  await setToken(newToken);
  return cart;
}

export async function getCartView(): Promise<CartView> {
  const cart = await resolveCart(false);
  if (!cart) return { lines: [], itemCount: 0, subtotalPence: 0, couponCode: null };
  return buildView(cart.id, cart.couponCode);
}

export async function getCartIdForCheckout() {
  return (await resolveCart(false))?.id ?? null;
}

export async function buildView(cartId: string, couponCode: string | null): Promise<CartView> {
  const items = await db.cartItem.findMany({
    where: { cartId },
    orderBy: { createdAt: "asc" },
    include: { variant: { include: { product: { include: { ...productInclude, taxClass: true } } } } },
  });
  const lines: CartLineView[] = items.map((it) => {
    const v = it.variant;
    const p = v.product;
    const mapped = mapProduct(p);
    const available = Math.max(0, v.stockOnHand - v.stockReserved);
    const sellable = p.status === "PUBLISHED" && !p.deletedAt && v.isActive;
    let issue: string | undefined;
    if (!sellable) issue = "No longer available";
    else if (available === 0) issue = "Sold out";
    else if (it.quantity > available) issue = `Only ${available} available`;
    return {
      variantId: v.id,
      productId: p.id,
      productSlug: p.slug,
      name: p.name,
      size: v.size,
      colour: v.colour,
      unitPricePence: v.pricePence ?? p.pricePence,
      compareAtPence: p.compareAtPricePence ?? undefined,
      image: mapped.images[0],
      quantity: it.quantity,
      maxQuantity: sellable ? Math.min(MAX_QTY, available) : 0,
      taxRateBps: p.taxClass?.rateBps ?? 2000,
      issue,
    };
  });
  return {
    lines,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalPence: lines.filter((l) => !l.issue).reduce((n, l) => n + l.quantity * l.unitPricePence, 0),
    couponCode,
  };
}

export class CartError extends Error {}

async function variantAvailability(variantId: string) {
  const v = await db.productVariant.findUnique({ where: { id: variantId }, include: { product: { select: { status: true, deletedAt: true } } } });
  if (!v || !v.isActive || v.product.status !== "PUBLISHED" || v.product.deletedAt) throw new CartError("This item is no longer available.");
  return Math.max(0, v.stockOnHand - v.stockReserved);
}

export async function addToCart(variantId: string, quantity: number) {
  const available = await variantAvailability(variantId);
  if (available === 0) throw new CartError("Sorry, this size and colour has just sold out.");
  const cart = (await resolveCart(true))!;
  const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
  const wanted = (existing?.quantity ?? 0) + quantity;
  const next = Math.min(wanted, available, MAX_QTY);
  if (existing) await db.cartItem.update({ where: { id: existing.id }, data: { quantity: next } });
  else await db.cartItem.create({ data: { cartId: cart.id, variantId, quantity: next } });
  return { view: await buildView(cart.id, cart.couponCode), capped: next < wanted, added: next - (existing?.quantity ?? 0) };
}

export async function setQuantity(variantId: string, quantity: number) {
  const cart = await resolveCart(false);
  if (!cart) return getCartView();
  if (quantity <= 0) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
  } else {
    const available = await variantAvailability(variantId).catch(() => 0);
    await db.cartItem.updateMany({
      where: { cartId: cart.id, variantId },
      data: { quantity: Math.max(1, Math.min(quantity, available || 1, MAX_QTY)) },
    });
  }
  return buildView(cart.id, cart.couponCode);
}

export async function setCartCoupon(code: string | null) {
  const cart = await resolveCart(code !== null);
  if (!cart) return getCartView();
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: code } });
  return buildView(cart.id, code);
}

export async function clearCart(cartId: string) {
  await db.cartItem.deleteMany({ where: { cartId } });
  await db.cart.update({ where: { id: cartId }, data: { couponCode: null } });
}

/** Current visitor's cart id WITHOUT side effects (safe to call while rendering a page). */
export async function peekCartId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user) return (await db.cart.findUnique({ where: { userId: user.id }, select: { id: true } }))?.id ?? null;
  const token = await readToken();
  return token ? ((await db.cart.findUnique({ where: { token }, select: { id: true } }))?.id ?? null) : null;
}
