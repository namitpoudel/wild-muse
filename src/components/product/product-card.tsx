import Link from "next/link";
import { MediaImage } from "@/components/brand/artwork";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { StarRating } from "@/components/ui/star-rating";
import { isNewArrival, isOnSale, sizeRangeLabel } from "@/lib/catalog/queries";
import type { Product } from "@/lib/catalog/types";
import { discountPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import { QuickAdd } from "./quick-add";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({ product, priority, className }: { product: Product; priority?: boolean; className?: string }) {
  const pct = discountPercent(product.pricePence, product.compareAtPricePence);
  const href = `/products/${product.slug}`;
  const [first, second] = product.images;
  const swatches = product.colours.slice(0, 4);
  return (
    <article className={cn("group relative", className)}>
      <div className="relative overflow-hidden rounded-[2px] bg-sand">
        <div className="aspect-[4/5]">
          <MediaImage media={first} priority={priority} className="transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.03]" />
          {second && (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <MediaImage media={second} />
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {isOnSale(product) && <Badge tone="sale">Sale −{pct}%</Badge>}
          {isNewArrival(product) && <Badge tone="new">New</Badge>}
          {product.isHandmade && <Badge tone="handmade">Handmade</Badge>}
        </div>
        <WishlistButton slug={product.slug} name={product.name} className="absolute right-2 top-2 z-10" />
        <QuickAdd product={product} />
      </div>
      <div className="mt-3.5 space-y-1.5">
        <h3 className="text-[0.95rem] font-medium leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] hover:text-terracotta focus-visible:outline-none group-has-[:focus-visible]:underline">
            {product.name}
          </Link>
        </h3>
        <Price pricePence={product.pricePence} compareAtPence={product.compareAtPricePence} showSaving={false} />
        <div className="flex items-center justify-between gap-2">
          <ul className="flex items-center gap-1.5" aria-label={`Available in ${product.colours.map((c) => c.name).join(", ")}`}>
            {swatches.map((c) => (
              <li key={c.name} className="size-3.5 rounded-full ring-1 ring-chocolate/20 ring-offset-1 ring-offset-linen" style={{ backgroundColor: c.hex }} title={c.name} />
            ))}
            {product.colours.length > 4 && <li className="text-xs text-bark">+{product.colours.length - 4}</li>}
          </ul>
          <span className="text-xs text-bark">Sizes {sizeRangeLabel(product)}</span>
        </div>
        <StarRating average={product.rating.average} count={product.rating.count} />
      </div>
    </article>
  );
}
