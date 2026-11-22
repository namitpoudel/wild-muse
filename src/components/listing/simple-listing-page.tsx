import { Suspense } from "react";
import type { Crumb } from "@/components/ui/breadcrumbs";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { getFacets } from "@/lib/catalog/queries";
import type { Product } from "@/lib/catalog/types";
import { ListingHeader } from "./listing-header";
import { ProductListing } from "./product-listing";

/** Shared layout for curated listings (new arrivals, best sellers, sale, collections). */
export function SimpleListingPage({
  title,
  intro,
  crumbs,
  products,
  chips,
  activeChip,
}: {
  title: string;
  intro?: string;
  crumbs: Crumb[];
  products: Product[];
  chips?: { label: string; href: string }[];
  activeChip?: string;
}) {
  return (
    <>
      <ListingHeader title={title} intro={intro} crumbs={crumbs} chips={chips} activeChip={activeChip} />
      <Suspense
        fallback={
          <div className="container-page py-12">
            <ProductGridSkeleton />
          </div>
        }
      >
        <ProductListing products={products} facets={getFacets(products)} />
      </Suspense>
    </>
  );
}
