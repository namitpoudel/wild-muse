import "server-only";
import type { Product } from "@/lib/catalog/types";
import { getCategories, getCollections, getProducts } from "./queries";

/**
 * Product search over the cached published catalogue.
 * Matches name, category/clothing type, department, colour, material, collection and
 * description with weighted relevance, plural tolerance and prefix matching (all terms must match).
 *
 * Scales comfortably to a few thousand products. For a much larger catalogue, switch to the
 * Postgres full-text / trigram indexes created in the "constraints" migration.
 */
const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const stem = (w: string) => w.replace(/(ies)$/, "y").replace(/(es|s)$/, "");
const WEIGHTS = { name: 10, type: 6, colour: 5, material: 4, collection: 3, description: 1 } as const;

export async function searchProducts(query: string, limit?: number): Promise<Product[]> {
  const terms = normalise(query)
    .split(" ")
    .filter((t) => t.length > 1)
    .slice(0, 8);
  if (!terms.length) return [];
  const [products, categories, collections] = await Promise.all([getProducts(), getCategories(), getCollections()]);
  const ranked = products
    .map((p) => {
      const cat = categories.find((c) => c.department === p.department && c.slug === p.categorySlug);
      const f = {
        name: normalise(p.name),
        type: normalise(`${cat?.name ?? ""} ${cat?.group ?? ""} ${p.department}`),
        colour: normalise(p.colours.map((c) => c.name).join(" ")),
        material: normalise(`${p.materials} ${p.fibreComposition}`),
        collection: normalise(
          collections
            .filter((c) => p.collectionSlugs.includes(c.slug))
            .map((c) => c.name)
            .join(" "),
        ),
        description: normalise(`${p.shortDescription} ${p.description} ${p.isHandmade ? "handmade" : ""}`),
      };
      let total = 0;
      for (const term of terms) {
        const t = stem(term);
        let best = 0;
        for (const [key, weight] of Object.entries(WEIGHTS) as [keyof typeof WEIGHTS, number][]) {
          const words = f[key].split(" ");
          if (words.some((w) => stem(w) === t)) best = Math.max(best, weight);
          else if (t.length >= 3 && words.some((w) => w.startsWith(t))) best = Math.max(best, weight * 0.7);
        }
        if (best === 0) return { p, s: 0 };
        total += best;
      }
      return { p, s: total };
    })
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || (a.p.bestsellerRank ?? 99) - (b.p.bestsellerRank ?? 99))
    .map((r) => r.p);
  return limit ? ranked.slice(0, limit) : ranked;
}

export interface Suggestion {
  products: { slug: string; name: string; pricePence: number; compareAtPricePence?: number; image: Product["images"][number] }[];
  categories: { label: string; href: string }[];
  total: number;
}

export async function getSuggestions(query: string): Promise<Suggestion> {
  const [results, categories] = await Promise.all([searchProducts(query), getCategories()]);
  const q = normalise(query);
  const label = (d: string) => (d === "accessories" ? "Accessories" : d[0].toUpperCase() + d.slice(1));
  const cats =
    q.length >= 2
      ? categories
          .filter((c) => normalise(c.name).includes(q) || q.split(" ").some((t) => t.length > 2 && stem(normalise(c.name)).includes(stem(t))))
          .slice(0, 4)
          .map((c) => ({ label: `${c.name} — ${label(c.department)}`, href: `/${c.department}/${c.slug}` }))
      : [];
  return {
    total: results.length,
    categories: cats,
    products: results
      .slice(0, 5)
      .map((p) => ({ slug: p.slug, name: p.name, pricePence: p.pricePence, compareAtPricePence: p.compareAtPricePence, image: p.images[0] })),
  };
}
