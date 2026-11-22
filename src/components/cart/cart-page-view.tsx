"use client";

import { ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import { formatPenceExact } from "@/lib/money";
import { CartLineItem } from "./cart-line-item";
import { FreeDeliveryMeter } from "./free-delivery-meter";
import { useStore } from "./store-provider";

export function CartPageView() {
  const { lines, subtotalPence, itemCount, ready } = useStore();
  if (!ready) {
    return (
      <div className="grid gap-10 lg:grid-cols-12" role="status" aria-label="Loading your bag">
        <div className="space-y-4 lg:col-span-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 lg:col-span-4" />
      </div>
    );
  }
  if (!lines.length) {
    return (
      <EmptyState icon={ShoppingBag} title="Your bag is empty" action={<ButtonLink href="/new-arrivals">Shop new arrivals</ButtonLink>}>
        Discover handmade dresses, knits and jewellery from Nepal.
      </EmptyState>
    );
  }
  const threshold = siteConfig.commerce.freeDeliveryThresholdPence;
  const deliveryLabel = subtotalPence >= threshold ? "Free" : `From ${formatPenceExact(siteConfig.commerce.standardDeliveryPence)}`;
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <FreeDeliveryMeter subtotalPence={subtotalPence} />
        <ul className="divide-y divide-sand border-b border-sand">
          {lines.map((l) => (
            <CartLineItem key={l.variantId} line={l} />
          ))}
        </ul>
      </div>
      <aside className="h-fit space-y-4 rounded-[2px] bg-cream p-6 lg:sticky lg:top-32 lg:col-span-4" aria-label="Order summary">
        <h2 className="font-display text-2xl">Order summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal ({itemCount} items)</dt>
            <dd className="font-semibold">{formatPenceExact(subtotalPence)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{deliveryLabel}</dd>
          </div>
        </dl>
        <p className="text-xs text-bark">Discount codes and final delivery cost are applied at checkout. All prices include VAT where applicable.</p>
        <ButtonLink href="/checkout" size="lg" block>
          Checkout securely
        </ButtonLink>
        <ButtonLink href="/" variant="link" className="w-full justify-center">
          Continue shopping
        </ButtonLink>
      </aside>
    </div>
  );
}
