"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/components/cart/store-provider";
import type { Product } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

/**
 * Quick add for product cards: pick a size (first colour) without leaving the grid.
 * Sold-out sizes are shown struck-through and disabled.
 */
export function QuickAdd({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const [open, setOpen] = useState(false);
  const colour = product.colours.find((c) => product.variants.some((v) => v.colour === c.name && v.stock > 0)) ?? product.colours[0];
  const variants = product.variants.filter((v) => v.colour === colour.name);
  const anyStock = variants.some((v) => v.stock > 0);

  const add = (variantId: string) => {
    const v = variants.find((x) => x.id === variantId)!;
    void addToCart(v.id, 1, { name: product.name, label: `${v.colour} · ${v.size}` });
    setOpen(false);
  };

  if (!anyStock) {
    return (
      <span className="absolute inset-x-2 bottom-2 z-10 rounded-[2px] bg-linen/90 py-2 text-center text-[0.7rem] font-bold uppercase tracking-[0.14em] text-bark">
        Sold out
      </span>
    );
  }

  return (
    <div className="absolute inset-x-2 bottom-2 z-10">
      {open ? (
        <div
          className="animate-fade-in rounded-[2px] bg-linen/95 p-2.5 shadow-soft backdrop-blur"
          role="group"
          aria-label={`Choose a size for ${product.name}, ${colour.name}`}
        >
          <p className="mb-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-bark">{colour.name} · choose size</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={v.stock === 0}
                onClick={(e) => {
                  e.preventDefault();
                  add(v.id);
                }}
                className={cn(
                  "h-8 min-w-9 rounded-[2px] border border-sand-deep bg-white px-2 text-xs font-semibold hover:border-chocolate",
                  v.stock === 0 && "cursor-not-allowed text-bark/60 line-through",
                )}
                aria-label={`Add size ${v.size}${v.stock === 0 ? " (sold out)" : ""}`}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (variants.length === 1) add(variants[0].id);
            else setOpen(true);
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-[2px] bg-linen/92 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-chocolate shadow-soft backdrop-blur transition-all hover:bg-chocolate hover:text-linen md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
          aria-label={`Quick add ${product.name} to bag`}
        >
          <Plus className="size-3.5" aria-hidden /> Quick add
        </button>
      )}
    </div>
  );
}
