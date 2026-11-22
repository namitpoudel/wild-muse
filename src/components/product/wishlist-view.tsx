"use client";

import { Heart } from "lucide-react";
import { useStore } from "@/components/cart/store-provider";
import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import type { Product } from "@/lib/catalog/types";

export function WishlistView({ products }: { products: Product[] }) {
  const { wishlist, ready } = useStore();
  if (!ready) return <ProductGridSkeleton count={4} />;
  const items = wishlist.map((s) => products.find((p) => p.slug === s)).filter((p): p is Product => !!p);
  if (!items.length)
    return (
      <EmptyState icon={Heart} title="Nothing saved yet" action={<ButtonLink href="/new-arrivals">Discover new arrivals</ButtonLink>}>
        Tap the heart on any piece to save it here.
      </EmptyState>
    );
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
