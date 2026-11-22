"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { MediaImage } from "@/components/brand/artwork";
import { Price } from "@/components/ui/price";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { type CartLine, useStore } from "./store-provider";

export function CartLineItem({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const { updateQuantity, removeLine } = useStore();
  return (
    <li className="flex gap-4 py-5">
      <Link href={`/products/${line.productSlug}`} onClick={onNavigate} className="block w-22 shrink-0 overflow-hidden rounded-[2px] bg-sand sm:w-26">
        <div className="aspect-[4/5]">
          <MediaImage media={line.image} />
        </div>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/products/${line.productSlug}`} onClick={onNavigate} className="line-clamp-2 font-medium leading-snug hover:text-terracotta">
              {line.name}
            </Link>
            <p className="mt-1 text-xs text-bark">
              {line.colour} · Size {line.size}
            </p>
          </div>
          <Price pricePence={line.unitPricePence * line.quantity} className="shrink-0 justify-end text-right" showSaving={false} />
        </div>
        {line.quantity >= line.maxQuantity && <p className="mt-1 text-xs font-medium text-warning">Only {line.maxQuantity} available</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantitySelector
            size="sm"
            value={line.quantity}
            max={line.maxQuantity}
            onChange={(n) => updateQuantity(line.variantId, n)}
            label={`Quantity for ${line.name}`}
          />
          <button
            type="button"
            onClick={() => removeLine(line.variantId)}
            className="inline-flex items-center gap-1.5 text-xs text-bark underline-offset-4 hover:text-danger hover:underline"
          >
            <Trash2 className="size-3.5" aria-hidden /> Remove<span className="sr-only"> {line.name}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
