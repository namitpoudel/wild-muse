"use client";

import Link from "next/link";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { useStore } from "@/components/cart/store-provider";

const iconBtn = "relative grid size-10 place-items-center rounded-full text-chocolate transition-colors hover:bg-sand/60";

function CountBadge({ n, label }: { n: number; label: string }) {
  if (n <= 0) return null;
  return (
    <span className="absolute right-0.5 top-0.5 grid min-w-4.5 place-items-center rounded-full bg-terracotta px-1 text-[0.6rem] font-bold leading-[1.15rem] text-white">
      {n > 99 ? "99+" : n}
      <span className="sr-only"> {label}</span>
    </span>
  );
}

export function HeaderActions() {
  const { itemCount, wishlist, setCartOpen, ready } = useStore();
  return (
    <div className="flex items-center">
      <Link href="/search" className={iconBtn} aria-label="Search">
        <Search className="size-5" />
      </Link>
      <Link href="/account" className={`${iconBtn} hidden sm:grid`} aria-label="Your account">
        <User className="size-5" />
      </Link>
      <Link href="/wishlist" className={`${iconBtn} hidden sm:grid`} aria-label={`Wishlist${ready && wishlist.length ? `, ${wishlist.length} items` : ""}`}>
        <Heart className="size-5" />
        {ready && <CountBadge n={wishlist.length} label="saved items" />}
      </Link>
      <button type="button" onClick={() => setCartOpen(true)} className={iconBtn} aria-label={`Shopping bag${ready && itemCount ? `, ${itemCount} items` : ""}`}>
        <ShoppingBag className="size-5" />
        {ready && <CountBadge n={itemCount} label="items in bag" />}
      </button>
    </div>
  );
}
