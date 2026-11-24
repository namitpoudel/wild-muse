import type { Metadata } from "next";
import { WishlistView } from "@/components/product/wishlist-view";
import { getProducts } from "@/server/catalog/queries";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const products = await getProducts();
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="font-display text-display-lg font-light">Wishlist</h1>
      <p className="mb-8 mt-2 text-sm text-bark">Saved on this device. Sign in (Stage 4) to keep your wishlist across devices.</p>
      <WishlistView products={products} />
    </div>
  );
}
