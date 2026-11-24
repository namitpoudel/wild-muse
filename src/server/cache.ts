import "server-only";
import { revalidateTag, updateTag } from "next/cache";

/**
 * Refresh cached storefront data after a write (admin edits, stock changes, orders).
 *
 * - Inside Server Actions we use `updateTag`: the next request waits for fresh data, so the
 *   admin immediately sees their change (read-your-own-writes).
 * - Elsewhere (Route Handlers such as payment webhooks) `updateTag` isn't allowed, so we use
 *   `revalidateTag(tag, "max")` (stale-while-revalidate).
 *
 * Never use `{ expire: 0 }`: short-lived cache entries become "dynamic holes" when an ISR page
 * regenerates, which breaks prerendered routes.
 */
export function expire(...tags: string[]) {
  for (const t of tags) {
    try {
      updateTag(t);
    } catch {
      try {
        revalidateTag(t, "max");
      } catch (e) {
        // Outside a Next.js request (CLI scripts, tests) there is no cache to refresh.
        if (process.env.NODE_ENV !== "test") console.warn(`[cache] could not refresh "${t}":`, (e as Error).message);
      }
    }
  }
}

export const TAGS = {
  products: "products",
  categories: "categories",
  collections: "collections",
  settings: "settings",
  content: "content",
  shipping: "shipping",
  reviews: "reviews",
  orders: "orders",
} as const;
