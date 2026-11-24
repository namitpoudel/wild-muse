import type { Metadata } from "next";
import { SimpleListingPage } from "@/components/listing/simple-listing-page";
import { getProducts } from "@/server/catalog/queries";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "The newest handmade bohemian clothing and accessories from Nepal, fresh into the Wild Muse studio.",
  alternates: { canonical: "/new-arrivals" },
};

export default async function NewArrivalsPage() {
  const products = await getProducts({ sort: "newest", limit: 24 });
  return (
    <SimpleListingPage
      title="New Arrivals"
      intro="Fresh from the workshops of Nepal — the latest handmade pieces, newest first."
      crumbs={[{ label: "Home", href: "/" }, { label: "New Arrivals" }]}
      products={products}
    />
  );
}
