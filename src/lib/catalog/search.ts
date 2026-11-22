/**
 * Product search. Matches name, category, department, clothing type, colour,
 * material, collection and description, with simple relevance scoring and
 * light typo tolerance (prefix + plural matching).
 *
 * Stage 4 replaces the body with a Postgres full-text query (tsvector +
 * pg_trgm for fuzzy matching); the function signatures stay the same.
 */
import { categories } from "./categories";
import { demoCollections, demoProducts } from "./demo-data";
import type { Product } from "./types";

export { POPULAR_SEARCHES } from "@/config/search";

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Collapse common plural / variant endings so "dresses" ≈ "dress", "trousers" ≈ "trouser". */
const stem = (w: string) => w.replace(/(ies)$/, "y").replace(/(es|s)$/, "");

function fields(p: Product) {
  const cat = categories.find((c) => c.department === p.department && c.slug === p.categorySlug);
  const cols = demoCollections.filter((c) => p.collectionSlugs.includes(c.slug)).map((c) => c.name);
  return {
    name: normalise(p.name),
    type: normalise(`${cat?.name ?? ""} ${cat?.group ?? ""} ${p.department}`),
    colour: normalise(p.colours.map((c) => c.name).join(" ")),
    material: normalise(`${p.materials} ${p.fibreComposition}`),
    collection: normalise(cols.join(" ")),
    description: normalise(`${p.shortDescription} ${p.description} ${p.isHandmade ? "handmade" : ""}`),
  };
}

const WEIGHTS = { name: 10, type: 6, colour: 5, material: 4, collection: 3, description: 1 } as const;

function scoreProduct(p: Product, terms: string[]) {
  const f = fields(p);
  let total = 0;
  for (const term of terms) {
    const t = stem(term);
    let best = 0;
    for (const [key, weight] of Object.entries(WEIGHTS) as [keyof typeof WEIGHTS, number][]) {
      const words = f[key].split(" ");
      if (words.some((w) => stem(w) === t)) best = Math.max(best, weight);
      else if (t.length >= 3 && words.some((w) => w.startsWith(t))) best = Math.max(best, weight * 0.7);
    }
    if (best === 0) return 0; // every term must match somewhere (AND semantics)
    total += best;
  }
  return total;
}

export async function searchProducts(query: string, limit?: number): Promise<Product[]> {
  const terms = normalise(query)
    .split(" ")
    .filter((t) => t.length > 1);
  if (!terms.length) return [];
  const ranked = demoProducts
    .map((p) => ({ p, s: scoreProduct(p, terms) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || (a.p.bestsellerRank ?? 99) - (b.p.bestsellerRank ?? 99));
  const out = ranked.map((r) => r.p);
  return limit ? out.slice(0, limit) : out;
}

export interface Suggestion {
  products: { slug: string; name: string; pricePence: number; compareAtPricePence?: number; image: Product["images"][number] }[];
  categories: { label: string; href: string }[];
  total: number;
}

export async function getSuggestions(query: string): Promise<Suggestion> {
  const results = await searchProducts(query);
  const q = normalise(query);
  const cats =
    q.length >= 2
      ? categories
          .filter((c) => normalise(c.name).includes(q) || q.split(" ").some((t) => t.length > 2 && stem(normalise(c.name)).includes(stem(t))))
          .slice(0, 4)
          .map((c) => ({
            label: `${c.name} — ${c.department === "accessories" ? "Accessories" : c.department[0].toUpperCase() + c.department.slice(1)}`,
            href: `/${c.department}/${c.slug}`,
          }))
      : [];
  return {
    total: results.length,
    categories: cats,
    products: results
      .slice(0, 5)
      .map((p) => ({ slug: p.slug, name: p.name, pricePence: p.pricePence, compareAtPricePence: p.compareAtPricePence, image: p.images[0] })),
  };
}
