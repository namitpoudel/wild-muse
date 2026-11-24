"use server";

import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";

/** Wishlist for signed-in customers (stored server-side so it follows them across devices). */
async function slugsFor(userId: string) {
  const rows = await db.wishlistItem.findMany({
    where: { userId },
    include: { product: { select: { slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => r.product.slug);
}

export async function getWishlistAction(): Promise<{ signedIn: boolean; slugs: string[]; name: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { signedIn: false, slugs: [], name: null };
  return { signedIn: true, slugs: await slugsFor(user.id), name: user.name };
}

export async function toggleWishlistAction(slug: string): Promise<{ ok: boolean; slugs: string[] }> {
  const user = await getCurrentUser();
  if (!user || !z.string().max(200).safeParse(slug).success) return { ok: false, slugs: [] };
  const product = await db.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return { ok: false, slugs: await slugsFor(user.id) };
  const existing = await db.wishlistItem.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } });
  if (existing) await db.wishlistItem.delete({ where: { id: existing.id } });
  else await db.wishlistItem.create({ data: { userId: user.id, productId: product.id } });
  return { ok: true, slugs: await slugsFor(user.id) };
}

/** Merge a guest (browser) wishlist into the account after sign-in. */
export async function mergeWishlistAction(slugs: string[]): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const clean = z.array(z.string().max(200)).max(200).safeParse(slugs);
  if (clean.success && clean.data.length) {
    const products = await db.product.findMany({ where: { slug: { in: clean.data } }, select: { id: true } });
    await db.wishlistItem.createMany({ data: products.map((p) => ({ userId: user.id, productId: p.id })), skipDuplicates: true });
  }
  return slugsFor(user.id);
}
