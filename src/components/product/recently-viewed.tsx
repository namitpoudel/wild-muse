"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/lib/catalog/types";

const KEY = "wm.recent.v1";

/** Records this product view and shows the visitor's other recently viewed products (stored in this browser only). */
export function RecentlyViewed({ current, candidates }: { current: string; candidates: Product[] }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    let prev: string[] = [];
    try {
      prev = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read browser-only history after mount
    setSlugs(prev.filter((s) => s !== current).slice(0, 4));
    try {
      localStorage.setItem(KEY, JSON.stringify([current, ...prev.filter((s) => s !== current)].slice(0, 12)));
    } catch {}
  }, [current]);

  const items = slugs.map((s) => candidates.find((p) => p.slug === s)).filter((p): p is Product => !!p);
  if (!items.length) return null;
  return (
    <section className="container-page py-14" aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="mb-8 font-display text-display-md">
        Recently viewed
      </h2>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
        {items.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
