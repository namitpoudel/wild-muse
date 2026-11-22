"use client";

import { Heart } from "lucide-react";
import { useStore } from "@/components/cart/store-provider";
import { cn } from "@/lib/utils";

export function WishlistButton({
  slug,
  name,
  className,
  variant = "overlay",
}: {
  slug: string;
  name: string;
  className?: string;
  variant?: "overlay" | "inline";
}) {
  const { isWishlisted, toggleWishlist, ready } = useStore();
  const active = ready && isWishlisted(slug);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggleWishlist(slug, name);
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={cn(
        "grid place-items-center rounded-full transition-[background-color,transform] active:scale-90",
        variant === "overlay" ? "size-9 bg-linen/90 shadow-soft hover:bg-linen" : "size-12 border border-sand-deep hover:border-chocolate",
        className,
      )}
    >
      <Heart className={cn("size-4.5 transition-colors", active ? "fill-terracotta text-terracotta" : "text-chocolate")} />
    </button>
  );
}
