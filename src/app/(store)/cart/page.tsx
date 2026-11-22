import type { Metadata } from "next";
import { CartPageView } from "@/components/cart/cart-page-view";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="mb-8 font-display text-display-lg font-light">Your bag</h1>
      <CartPageView />
    </div>
  );
}
