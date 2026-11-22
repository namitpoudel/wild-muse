"use client";

import { Check, Clock, MessageCircleQuestion, Share2, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/components/cart/store-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TextArea, TextField } from "@/components/ui/field";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import type { Product } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { SizeGuideDialog } from "./size-guide-dialog";
import { WishlistButton } from "./wishlist-button";

const LOW_STOCK = 3;

/**
 * Variant selection + purchase actions. Availability is computed per colour/size
 * variant; unavailable combinations cannot be added. The server re-validates stock
 * when the order is created (Stage 4), so this is a UX guard, not the source of truth.
 */
export function BuyBox({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const router = useRouter();
  const firstAvailableColour =
    product.colours.find((c) => product.variants.some((v) => v.colour === c.name && v.stock > 0))?.name ?? product.colours[0].name;
  const [colour, setColour] = useState(firstAvailableColour);
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  const variantsForColour = useMemo(() => product.variants.filter((v) => v.colour === colour), [product.variants, colour]);
  const variant = size ? variantsForColour.find((v) => v.size === size) : undefined;
  const stock = variant?.stock ?? 0;
  const soldOutEverywhere = product.variants.every((v) => v.stock === 0);

  function selectColour(name: string) {
    setColour(name);
    const v = product.variants.find((x) => x.colour === name && x.size === size);
    if (v && v.stock === 0) setSize(null);
    setQty(1);
  }

  function add(goToCheckout: boolean) {
    if (!variant) {
      setSizeError(true);
      document.getElementById("size-options")?.focus();
      return;
    }
    if (variant.stock < qty) return;
    addToCart(
      {
        variantId: variant.id,
        productSlug: product.slug,
        name: product.name,
        size: variant.size,
        colour: variant.colour,
        unitPricePence: product.pricePence,
        compareAtPence: product.compareAtPricePence,
        image: product.images[0],
        maxQuantity: variant.stock,
      },
      qty,
      { openDrawer: !goToCheckout },
    );
    if (goToCheckout) router.push("/checkout");
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      /* user cancelled share sheet */
    }
  }

  return (
    <div className="space-y-6">
      {/* Colour */}
      <fieldset>
        <legend className="mb-3 text-sm">
          <span className="font-semibold">Colour:</span> {colour}
        </legend>
        <div className="flex flex-wrap gap-2.5">
          {product.colours.map((c) => {
            const available = product.variants.some((v) => v.colour === c.name && v.stock > 0);
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => selectColour(c.name)}
                aria-pressed={colour === c.name}
                aria-label={`${c.name}${available ? "" : " (sold out)"}`}
                title={c.name}
                className={cn(
                  "relative size-10 rounded-full ring-offset-2 ring-offset-linen transition-shadow",
                  colour === c.name ? "ring-2 ring-chocolate" : "ring-1 ring-chocolate/20 hover:ring-chocolate/60",
                )}
                style={{ backgroundColor: c.hex }}
              >
                {!available && <span className="absolute inset-0 m-auto h-px w-[120%] -translate-x-[8%] rotate-45 bg-chocolate/70" aria-hidden />}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Size */}
      {product.sizes.length > 1 && (
        <fieldset aria-describedby={sizeError ? "size-error" : undefined}>
          <div className="mb-3 flex items-center justify-between">
            <legend className="text-sm">
              <span className="font-semibold">Size:</span> {size ?? "Select a size"}
            </legend>
            <SizeGuideDialog guideKey={product.sizeGuide ?? "one-size"} />
          </div>
          <div id="size-options" tabIndex={-1} className="grid grid-cols-4 gap-2 outline-none sm:grid-cols-5">
            {product.sizes.map((s) => {
              const v = variantsForColour.find((x) => x.size === s);
              const out = !v || v.stock === 0;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={out}
                  onClick={() => {
                    setSize(s);
                    setSizeError(false);
                    setQty(1);
                  }}
                  aria-pressed={size === s}
                  aria-label={`Size ${s}${out ? ", sold out" : v && v.stock <= LOW_STOCK ? `, only ${v.stock} left` : ""}`}
                  className={cn(
                    "relative h-11 rounded-[2px] border text-sm font-semibold transition-colors",
                    size === s ? "border-chocolate bg-chocolate text-linen" : "border-sand-deep bg-white/60 hover:border-chocolate",
                    out && "cursor-not-allowed border-sand bg-transparent text-bark/50 line-through",
                  )}
                >
                  {s}
                  {!out && v && v.stock <= LOW_STOCK && size !== s && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-burnt" aria-hidden />}
                </button>
              );
            })}
          </div>
          {sizeError && (
            <p id="size-error" role="alert" className="mt-2 text-sm font-medium text-danger">
              Please choose a size.
            </p>
          )}
        </fieldset>
      )}

      {/* Stock status */}
      <p className="flex items-center gap-2 text-sm" aria-live="polite">
        {soldOutEverywhere ? (
          <span className="font-semibold text-danger">Sold out — more coming soon</span>
        ) : !variant ? (
          <span className="text-bark">Select {product.sizes.length > 1 ? "a size" : "an option"} to see availability</span>
        ) : stock === 0 ? (
          <span className="font-semibold text-danger">Sold out in this size and colour</span>
        ) : stock <= LOW_STOCK ? (
          <span className="font-semibold text-warning">
            <Clock className="mr-1 inline size-4" aria-hidden />
            Only {stock} left — handmade in small batches
          </span>
        ) : (
          <span className="font-semibold text-success">
            <Check className="mr-1 inline size-4" aria-hidden />
            In stock, ready to dispatch
          </span>
        )}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <QuantitySelector value={qty} onChange={setQty} max={Math.max(1, stock)} />
        <Button size="lg" className="flex-1" onClick={() => add(false)} disabled={soldOutEverywhere || (!!variant && stock === 0)}>
          Add to bag
        </Button>
        <WishlistButton slug={product.slug} name={product.name} variant="inline" />
      </div>
      <Button variant="dark" size="lg" block onClick={() => add(true)} disabled={soldOutEverywhere || (!!variant && stock === 0)}>
        Buy now
      </Button>

      <ul className="space-y-2 rounded-[2px] bg-cream p-4 text-sm">
        <li className="flex gap-2.5">
          <Truck className="mt-0.5 size-4 shrink-0 text-olive" aria-hidden />
          <span>
            <strong>UK standard delivery 2–4 working days</strong> — free over £75. Express next working day available.
          </span>
        </li>
        <li className="flex gap-2.5 text-bark">
          <Check className="mt-0.5 size-4 shrink-0 text-olive" aria-hidden /> 30-day returns. Your 14-day statutory cancellation right is unaffected.
        </li>
      </ul>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <button type="button" onClick={share} className="inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline">
          <Share2 className="size-4" aria-hidden /> Share
        </button>
        <AskQuestion productName={product.name} />
      </div>
    </div>
  );
}

function AskQuestion({ productName }: { productName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline">
        <MessageCircleQuestion className="size-4" aria-hidden /> Ask about this product
      </DialogTrigger>
      <DialogContent title="Ask about this product" description={productName}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            toast.info("Enquiries are emailed to the shop from Stage 5 — nothing was sent yet.");
            setOpen(false);
          }}
        >
          <TextField label="Your name" name="name" autoComplete="name" required />
          <TextField label="Email" name="email" type="email" autoComplete="email" required />
          <TextArea label="Your question" name="message" required hint="e.g. garment measurements, fabric weight, or care advice." />
          <Button type="submit" block>
            Send question
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
