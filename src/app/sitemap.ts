import type { MetadataRoute } from "next";
import { handmadePages } from "@/content/handmade";
import { contentPages } from "@/content/pages";
import { categories, departments } from "@/lib/catalog/categories";
import { getCollections, getProducts } from "@/lib/catalog/queries";
import { absoluteUrl } from "@/lib/seo";

/** XML sitemap of all public, indexable URLs (account, checkout and search are excluded). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const fixed = ["/", "/new-arrivals", "/best-sellers", "/sale", "/collections", "/handmade-in-nepal", "/track-order"];
  return [
    ...fixed.map((p) => ({ url: absoluteUrl(p), changeFrequency: "daily" as const, priority: p === "/" ? 1 : 0.8 })),
    ...departments.map((d) => ({ url: absoluteUrl(`/${d.slug}`), changeFrequency: "daily" as const, priority: 0.9 })),
    ...categories.map((c) => ({ url: absoluteUrl(`/${c.department}/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...collections.map((c) => ({ url: absoluteUrl(`/collections/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({
      url: absoluteUrl(`/products/${p.slug}`),
      lastModified: p.publishedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...handmadePages.map((p) => ({ url: absoluteUrl(`/handmade-in-nepal/${p.slug}`), changeFrequency: "monthly" as const, priority: 0.5 })),
    ...contentPages.map((p) => ({ url: absoluteUrl(`/pages/${p.slug}`), changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
}
