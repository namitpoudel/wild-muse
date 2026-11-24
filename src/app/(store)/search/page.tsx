import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Suspense } from "react";
import { ProductListing } from "@/components/listing/product-listing";
import { ProductRail } from "@/components/home/product-rail";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";
import { getBestSellers } from "@/server/catalog/queries";
import { getFacets } from "@/lib/catalog/product-utils";
import { searchProducts } from "@/server/catalog/search";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <Suspense
      fallback={
        <div className="container-page space-y-8 py-12">
          <Skeleton className="h-12 w-72" />
          <ProductGridSkeleton />
        </div>
      }
    >
      <Results searchParams={searchParams} />
    </Suspense>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : (raw ?? "")).slice(0, 80).trim();
  const [results, settings] = await Promise.all([q ? searchProducts(q) : Promise.resolve([]), getSettings()]);
  const POPULAR_SEARCHES = settings.popularSearches;

  return (
    <>
      <div className="texture-grain border-b border-sand bg-cream">
        <div className="container-page py-8 md:py-12">
          <p className="eyebrow text-terracotta">Search</p>
          <h1 className="mt-3 font-display text-display-lg font-light">{q ? <>&ldquo;{q}&rdquo;</> : "Search the shop"}</h1>
          <form action="/search" role="search" className="mt-6 flex max-w-xl gap-2">
            <label htmlFor="search-page-q" className="sr-only">
              Search products
            </label>
            <input
              id="search-page-q"
              name="q"
              type="search"
              defaultValue={q}
              maxLength={80}
              placeholder="Try ‘olive harem pants’ or ‘wool’"
              className="h-12 flex-1 rounded-[2px] border border-sand-deep bg-linen px-4 focus:border-chocolate focus:outline-none"
            />
            <button
              type="submit"
              className="h-12 rounded-[2px] bg-chocolate px-6 text-xs font-bold uppercase tracking-[0.14em] text-linen hover:bg-[#2a1910]"
            >
              Search
            </button>
          </form>
        </div>
      </div>
      {results.length > 0 ? (
        <Suspense
          fallback={
            <div className="container-page py-12">
              <ProductGridSkeleton />
            </div>
          }
        >
          <ProductListing products={results} facets={getFacets(results)} />
        </Suspense>
      ) : (
        <>
          <div className="container-page py-6">
            <EmptyState icon={SearchX} title={q ? "No products found" : "What are you looking for?"}>
              {q ? (
                <>We couldn&apos;t find anything for &ldquo;{q}&rdquo;. Check the spelling, use fewer words, or try a popular search:</>
              ) : (
                <>Search by product name, colour, material, category or collection. Popular right now:</>
              )}
              <span className="mt-4 flex flex-wrap justify-center gap-2">
                {POPULAR_SEARCHES.map((p) => (
                  <Link
                    key={p}
                    href={`/search?q=${encodeURIComponent(p)}`}
                    className="rounded-full bg-sand px-3.5 py-1.5 text-sm text-chocolate hover:bg-sand-deep"
                  >
                    {p}
                  </Link>
                ))}
              </span>
            </EmptyState>
          </div>
          <ProductRail
            id="search-bestsellers"
            eyebrow="Best sellers"
            title="You might like these"
            href="/best-sellers"
            products={await getBestSellers(4)}
            tone="cream"
          />
        </>
      )}
    </>
  );
}
