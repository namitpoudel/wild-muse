"use client";

import { ShoppingBag } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPenceExact } from "@/lib/money";
import { CartLineItem } from "./cart-line-item";
import { FreeDeliveryMeter } from "./free-delivery-meter";
import { useStore } from "./store-provider";

export function CartDrawer() {
  const { cartOpen, setCartOpen, lines, itemCount, subtotalPence } = useStore();
  const close = () => setCartOpen(false);
  return (
    <Dialog open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent title={`Your bag${itemCount ? ` (${itemCount})` : ""}`}>
        {lines.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Your bag is empty"
            className="my-auto"
            action={
              <Button variant="dark" onClick={close}>
                Continue shopping
              </Button>
            }
          >
            Handmade pieces you add will appear here.
          </EmptyState>
        ) : (
          <>
            <div className="px-5 pt-4">
              <FreeDeliveryMeter subtotalPence={subtotalPence} />
            </div>
            <ul className="flex-1 divide-y divide-sand overflow-y-auto px-5">
              {lines.map((l) => (
                <CartLineItem key={l.variantId} line={l} onNavigate={close} />
              ))}
            </ul>
            <div className="space-y-3 border-t border-sand bg-cream/60 p-5">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Subtotal</span>
                <span className="font-semibold">{formatPenceExact(subtotalPence)}</span>
              </div>
              <p className="text-xs text-bark">Delivery and discount codes are calculated at checkout. Prices include VAT where applicable.</p>
              <ButtonLink href="/checkout" block size="lg" onClick={close}>
                Checkout securely
              </ButtonLink>
              <ButtonLink href="/cart" variant="outline" block onClick={close}>
                View bag
              </ButtonLink>
            </div>
          </>
        )}
      </SheetContent>
    </Dialog>
  );
}
