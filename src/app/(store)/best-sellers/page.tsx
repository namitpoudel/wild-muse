import type { Metadata } from "next";
import { SimpleListingPage } from "@/components/listing/simple-listing-page";
import { getProducts } from "@/server/catalog/queries";

export const metadata: Metadata = {
  title: "Best Sellers",
  description: "Our most-loved handmade bohemian pieces.",
  alternates: { canonical: "/best-sellers" },
};

export default async function BestSellersPage() {
  // Stage 4: ranked by units sold in paid orders over the last 90 days.
  const products = (await getProducts({ sort: "bestselling" })).filter((p) => p.bestsellerRank);
  return (
    <SimpleListingPage
      title="Best Sellers"
      intro="The pieces our customers keep coming back for."
      crumbs={[{ label: "Home", href: "/" }, { label: "Best Sellers" }]}
      products={products}
    />
  );
}
