import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { expire, TAGS } from "./cache";
import { db } from "./db";

/**
 * Reviews (DMCC Act 2024 / CMA208 compliant):
 * - only signed-in customers can review; one review per product per customer
 * - "verified purchase" is computed from paid orders — never taken from input
 * - every new or edited review is held for moderation before it appears
 * - published ratings use ALL approved reviews (negative ones are never suppressed)
 */
const PAID: Prisma.OrderWhereInput["status"] = { in: ["PAID", "PROCESSING", "DISPATCHED", "DELIVERED", "PARTIALLY_REFUNDED"] };

export async function hasPurchased(userId: string, productId: string) {
  return (await db.orderItem.count({ where: { productId, order: { userId, status: PAID } } })) > 0;
}

export interface PublicReview {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  verifiedPurchase: boolean;
  dateLabel: string;
  variantLabel?: string;
  images: { url: string; alt: string }[];
}

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export async function getApprovedReviews(productId: string): Promise<PublicReview[]> {
  "use cache";
  cacheTag(TAGS.reviews, `reviews:${productId}`);
  cacheLife("hours");
  const rows = await db.review.findMany({
    where: { productId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: { images: true },
    take: 100,
  });
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    // First name + initial only — never the full name.
    authorName: r.authorName,
    verifiedPurchase: r.verifiedPurchase,
    dateLabel: fmt.format(r.createdAt),
    variantLabel: r.variantLabel ?? undefined,
    images: r.images.map((i) => ({ url: i.url, alt: i.alt })),
  }));
}

export async function getLatestApprovedReviews(limit = 3): Promise<(PublicReview & { productName: string; productSlug: string })[]> {
  "use cache";
  cacheTag(TAGS.reviews);
  cacheLife("hours");
  const rows = await db.review.findMany({
    where: { status: "APPROVED", rating: { gte: 4 } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { images: true, product: { select: { name: true, slug: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    authorName: r.authorName,
    verifiedPurchase: r.verifiedPurchase,
    dateLabel: fmt.format(r.createdAt),
    images: [],
    productName: r.product.name,
    productSlug: r.product.slug,
  }));
}

export const publicName = (full: string) => {
  const [first, ...rest] = full.trim().split(/\s+/);
  const last = rest.pop();
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
};

/** Recalculate a product's published rating from approved reviews. */
export async function recomputeRating(productId: string, tx: Prisma.TransactionClient = db) {
  const agg = await tx.review.aggregate({ where: { productId, status: "APPROVED" }, _avg: { rating: true }, _count: true });
  await tx.product.update({ where: { id: productId }, data: { ratingAverage: agg._avg.rating ?? 0, ratingCount: agg._count } });
  expire(TAGS.products, TAGS.reviews);
}
