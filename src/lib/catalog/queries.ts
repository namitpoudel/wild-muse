/**
 * Catalogue data access. UI components only ever call these functions.
 * Stage 4 swaps the implementation to Prisma queries (with pagination and
 * Postgres full-text search) — signatures stay the same.
 */
import { demoCollections, demoProducts } from "./demo-data";
import type { Department, Product } from "./types";

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

export function isOnSale(p: Product) {
  return !!p.compareAtPricePence && p.compareAtPricePence > p.pricePence;
}

export function totalStock(p: Product) {
  return p.variants.reduce((n, v) => n + v.stock, 0);
}

export async function getProducts(q: ProductQuery = {}): Promise<Product[]> {
  let list = demoProducts.filter(
    (p) =>
      (!q.department || p.department === q.department) &&
      (!q.category || p.categorySlug === q.category) &&
      (!q.collection || p.collectionSlugs.includes(q.collection)) &&
      (!q.saleOnly || isOnSale(p)),
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
      list = [...list].sort((a, b) => (a.bestsellerRank ?? 999) - (b.bestsellerRank ?? 999));
      break;
    case "rating":
      list = [...list].sort((a, b) => b.rating.average - a.rating.average);
      break;
    default:
      list = [...list].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || byNewest(a, b));
  }
  return q.limit ? list.slice(0, q.limit) : list;
}

export async function getProductBySlug(slug: string) {
  return demoProducts.find((p) => p.slug === slug) ?? null;
}

export async function getAllProductSlugs() {
  return demoProducts.map((p) => p.slug);
}

export async function getBestSellers(limit = 8) {
  return getProducts({ sort: "bestselling", limit }).then((l) => l.filter((p) => p.bestsellerRank));
}

export async function getNewArrivals(limit = 8) {
  return getProducts({ sort: "newest", limit });
}

export async function getRelatedProducts(product: Product, limit = 4) {
  const scored = demoProducts
    .filter((p) => p.id !== product.id)
    .map((p) => ({
      p,
      score:
        (p.categorySlug === product.categorySlug ? 3 : 0) +
        (p.department === product.department ? 2 : 0) +
        p.collectionSlugs.filter((c) => product.collectionSlugs.includes(c)).length,
    }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.p);
}

export async function getCollections() {
  return demoCollections;
}

export async function getCollection(slug: string) {
  return demoCollections.find((c) => c.slug === slug) ?? null;
}

/** Facet values present in a product list — drives the filter sidebar. */
export function getFacets(products: Product[]) {
  const sizes = new Set<string>();
  const colours = new Map<string, string>();
  const materials = new Set<string>();
  let min = Infinity;
  let max = 0;
  for (const p of products) {
    p.sizes.forEach((s) => sizes.add(s));
    p.colours.forEach((c) => colours.set(c.name, c.hex));
    p.fibreComposition
      .split(/[.,]/)
      .map((m) => m.replace(/.*?\d+%\s*/, "").replace(/\(.*\)/, "").trim().toLowerCase())
      .filter((m) => m && !m.includes("applicable") && m.length < 20)
      .forEach((m) => materials.add(m.replace(/^./, (ch) => ch.toUpperCase())));
    min = Math.min(min, p.pricePence);
    max = Math.max(max, p.pricePence);
  }
  return {
    sizes: [...sizes].sort((a, b) => sizeRank(a) - sizeRank(b)),
    colours: [...colours.entries()].map(([name, hex]) => ({ name, hex })),
    materials: [...materials].sort(),
    price: { min: Number.isFinite(min) ? min : 0, max },
  };
}

/** "New" badge: the most recently published products (date-free, so pages can be prerendered). */
const NEW_COUNT = 6;
const newSlugs = new Set([...demoProducts].sort(byNewest).slice(0, NEW_COUNT).map((p) => p.slug));
export function isNewArrival(p: Product) {
  return newSlugs.has(p.slug);
}

export function sizeRangeLabel(p: Product) {
  if (p.sizes.length === 1) return p.sizes[0];
  return `${p.sizes[0]}–${p.sizes[p.sizes.length - 1]}`;
}

const SIZE_ORDER = ["XS", "S", "S/M", "M", "M/L", "L", "XL", "XXL", "One size"];
/** Canonical size ordering: letter sizes, then numeric UK sizes, then kids' ages. */
function sizeRank(size: string) {
  const i = SIZE_ORDER.indexOf(size);
  if (i >= 0) return i;
  const n = parseInt(size, 10);
  return Number.isNaN(n) ? 1000 : 100 + n;
}
