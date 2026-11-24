/** Pure, client-safe helpers for catalogue data (no database access). */
import type { Product } from "./types";

export function isOnSale(p: Pick<Product, "pricePence" | "compareAtPricePence">) {
  return !!p.compareAtPricePence && p.compareAtPricePence > p.pricePence;
}

export function totalStock(p: Pick<Product, "variants">) {
  return p.variants.reduce((n, v) => n + v.stock, 0);
}

export function isNewArrival(p: Pick<Product, "isNew">) {
  return !!p.isNew;
}

const SIZE_ORDER = ["XS", "S", "S/M", "M", "M/L", "L", "XL", "XXL", "One size"];
/** Canonical size ordering: letter sizes, then numeric UK sizes, then kids' ages. */
export function sizeRank(size: string) {
  const i = SIZE_ORDER.indexOf(size);
  if (i >= 0) return i;
  const n = parseInt(size, 10);
  return Number.isNaN(n) ? 1000 : 100 + n;
}

export function sizeRangeLabel(p: Pick<Product, "sizes">) {
  if (p.sizes.length === 1) return p.sizes[0];
  return `${p.sizes[0]}–${p.sizes[p.sizes.length - 1]}`;
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
      .map((m) =>
        m
          .replace(/.*?\d+%\s*/, "")
          .replace(/\(.*\)/, "")
          .replace(/—.*/, "")
          .trim()
          .toLowerCase(),
      )
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
