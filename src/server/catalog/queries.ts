import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Department as DbDepartment, Prisma } from "@/generated/prisma/client";
import { sizeRank } from "@/lib/catalog/product-utils";
import type { ArtworkKind, ArtworkTone, Category, Collection, Department, MediaAsset, Product } from "@/lib/catalog/types";
import { db } from "../db";

/**
 * Storefront catalogue queries.
 *
 * Reads are cached with `use cache` and tagged; admin edits, stock changes and orders
 * expire the tags (see src/server/cache.ts), so pages stay fast without going stale.
 * Only PUBLISHED, non-deleted products are ever returned here.
 */
export const CATALOG_TAG = "products";
export const CATEGORIES_TAG = "categories";
export const COLLECTIONS_TAG = "collections";

const NEW_COUNT = 6;

export const toDept = (d: DbDepartment) => d.toLowerCase() as Department;
export const fromDept = (d: Department) => d.toUpperCase() as DbDepartment;

export const productInclude = {
  category: { select: { slug: true, name: true } },
  colours: { orderBy: { sortOrder: "asc" } },
  variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
  images: { orderBy: { sortOrder: "asc" } },
  collections: { select: { collection: { select: { slug: true } } } },
} satisfies Prisma.ProductInclude;

type DbProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

const VIEWS = ["front view", "detail of the handwork", "styled on model", "back view"];

export function mapProduct(p: DbProduct, newIds?: Set<string>): Product {
  const images: MediaAsset[] = p.images.length
    ? p.images.map((i) => ({ src: i.url, alt: i.alt, kind: p.artKind as ArtworkKind, tone: (p.artTones[0] ?? "sand") as ArtworkTone }))
    : p.artTones.map((tone, i) => ({
        kind: p.artKind as ArtworkKind,
        tone: tone as ArtworkTone,
        alt: `${p.name}, ${VIEWS[i % VIEWS.length]} (placeholder image)`,
      }));
  if (!images.length) images.push({ kind: p.artKind as ArtworkKind, tone: "sand", alt: `${p.name} (placeholder image)` });
  const sizes = [...new Set(p.variants.map((v) => v.size))].sort((a, b) => sizeRank(a) - sizeRank(b));
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    department: toDept(p.department),
    categorySlug: p.category.slug,
    categoryName: p.category.name,
    collectionSlugs: p.collections.map((c) => c.collection.slug),
    pricePence: p.pricePence,
    compareAtPricePence: p.compareAtPricePence ?? undefined,
    colours: p.colours.map((c) => ({ name: c.name, hex: c.hex })),
    sizes,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      colour: v.colour,
      stock: Math.max(0, v.stockOnHand - v.stockReserved),
    })),
    shortDescription: p.shortDescription,
    description: p.description,
    fibreComposition: p.fibreComposition,
    materials: p.materials,
    care: p.care,
    countryOfOrigin: p.countryOfOrigin,
    isHandmade: p.isHandmade,
    craftStory: p.craftStory ?? undefined,
    isFeatured: p.isFeatured,
    bestsellerRank: p.bestsellerRank ?? undefined,
    publishedAt: (p.publishedAt ?? p.createdAt).toISOString().slice(0, 10),
    isNew: newIds?.has(p.id) ?? false,
    rating: { average: p.ratingAverage, count: p.ratingCount },
    images,
    sizeGuide: (p.sizeGuide ?? undefined) as Product["sizeGuide"],
  };
}

const PUBLISHED = { status: "PUBLISHED", deletedAt: null } satisfies Prisma.ProductWhereInput;

/** All published products (the catalogue is small enough to cache whole; listing filters run on it). */
async function allPublished(): Promise<Product[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const rows = await db.product.findMany({ where: PUBLISHED, include: productInclude, orderBy: [{ publishedAt: "desc" }] });
  const newIds = new Set(rows.slice(0, NEW_COUNT).map((r) => r.id));
  return rows.map((r) => mapProduct(r, newIds));
}

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "bestselling" | "rating";

export interface ProductQuery {
  department?: Department;
  category?: string;
  collection?: string;
  saleOnly?: boolean;
  sort?: SortKey;
  limit?: number;
}

const byNewest = (a: Product, b: Product) => b.publishedAt.localeCompare(a.publishedAt);

export async function getProducts(q: ProductQuery = {}): Promise<Product[]> {
  const ranks = q.sort === "bestselling" ? await getSalesRanks() : null;
  let list = (await allPublished()).filter(
    (p) =>
      (!q.department || p.department === q.department) &&
      (!q.category || p.categorySlug === q.category) &&
      (!q.collection || p.collectionSlugs.includes(q.collection)) &&
      (!q.saleOnly || (p.compareAtPricePence && p.compareAtPricePence > p.pricePence)),
  );
  switch (q.sort ?? "featured") {
    case "newest":
      list = [...list].sort(byNewest);
      break;
    case "price-asc":
      list = [...list].sort((a, b) => a.pricePence - b.pricePence);
      break;
    case "price-desc":
      list = [...list].sort((a, b) => b.pricePence - a.pricePence);
      break;
    case "bestselling":
      list = [...list].sort((a, b) => bestsellerScore(b, ranks!) - bestsellerScore(a, ranks!));
      break;
    case "rating":
      list = [...list].sort((a, b) => b.rating.average - a.rating.average);
      break;
    default:
      list = [...list].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || byNewest(a, b));
  }
  return q.limit ? list.slice(0, q.limit) : list;
}

/** Units sold in paid orders over the last 90 days, by product id. */
async function getSalesRanks(): Promise<Record<string, number>> {
  "use cache";
  cacheTag(CATALOG_TAG, "orders");
  cacheLife("hours");
  const since = new Date(Date.now() - 90 * 86400_000);
  const rows = await db.orderItem.groupBy({
    by: ["productId"],
    where: { order: { status: { in: ["PAID", "PROCESSING", "DISPATCHED", "DELIVERED"] }, placedAt: { gte: since } } },
    _sum: { quantity: true },
  });
  return Object.fromEntries(rows.map((r) => [r.productId, r._sum.quantity ?? 0]));
}

/** Real sales first; the owner's manual "best seller" pin breaks ties / fills in before launch. */
function bestsellerScore(p: Product, ranks: Record<string, number>) {
  return (ranks[p.id] ?? 0) * 1000 + (p.bestsellerRank ? 100 - p.bestsellerRank : 0);
}

export async function getBestSellers(limit = 8) {
  const ranks = await getSalesRanks();
  return (await getProducts({ sort: "bestselling" })).filter((p) => bestsellerScore(p, ranks) > 0).slice(0, limit);
}

export async function getNewArrivals(limit = 8) {
  return getProducts({ sort: "newest", limit });
}

export async function getProductBySlug(slug: string) {
  return (await allPublished()).find((p) => p.slug === slug) ?? null;
}

export async function getProductsByIds(ids: string[]) {
  const all = await allPublished();
  return ids.map((id) => all.find((p) => p.id === id)).filter((p): p is Product => !!p);
}

export async function getAllProductSlugs() {
  return (await allPublished()).map((p) => p.slug);
}

export async function getRelatedProducts(product: Product, limit = 4) {
  return (await allPublished())
    .filter((p) => p.id !== product.id)
    .map((p) => ({
      p,
      score:
        (p.categorySlug === product.categorySlug ? 3 : 0) +
        (p.department === product.department ? 2 : 0) +
        p.collectionSlugs.filter((c) => product.collectionSlugs.includes(c)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.p);
}

// ── Categories & collections ──

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheTag(CATEGORIES_TAG);
  cacheLife("hours");
  const rows = await db.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return rows.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    group: c.groupName,
    department: toDept(c.department),
    description: c.description ?? undefined,
  }));
}

export async function getCollections(): Promise<Collection[]> {
  "use cache";
  cacheTag(COLLECTIONS_TAG);
  cacheLife("hours");
  const rows = await db.collection.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return rows.map((c) => ({
    id: c.id,
    featured: c.isFeatured,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    image: {
      src: c.imageUrl ?? undefined,
      kind: c.artKind as ArtworkKind,
      tone: c.artTone as ArtworkTone,
      alt: `${c.name} collection` + (c.imageUrl ? "" : " (placeholder image)"),
    },
  }));
}

export async function getCollection(slug: string) {
  return (await getCollections()).find((c) => c.slug === slug) ?? null;
}

/** Live stock for one product — bypasses the cache so the product page shows current availability. */
export async function getLiveStock(productId: string) {
  const rows = await db.productVariant.findMany({
    where: { productId, isActive: true },
    select: { id: true, stockOnHand: true, stockReserved: true },
  });
  return Object.fromEntries(rows.map((v) => [v.id, Math.max(0, v.stockOnHand - v.stockReserved)]));
}
