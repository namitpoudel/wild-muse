import type { Metadata } from "next";
import { SimpleListingPage } from "@/components/listing/simple-listing-page";
import { getProducts } from "@/lib/catalog/queries";

export const metadata: Metadata = {
  title: "Sale",
  description: "Handmade bohemian clothing and accessories on sale at Wild Muse.",
  alternates: { canonical: "/sale" },
};

export default async function SalePage() {
  const products = await getProducts({ saleOnly: true, sort: "price-asc" });
  return (
    <SimpleListingPage
      title="Sale"
      intro="Handmade pieces at reduced prices, while stock lasts. Reductions are shown against the price we previously sold each item at."
      crumbs={[{ label: "Home", href: "/" }, { label: "Sale" }]}
      products={products}
    />
  );
}
