import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/server/db";
import { cancelPendingOrder } from "@/server/orders/orders";
import { expireCheckoutSession, isStripeConfigured } from "@/server/payments/stripe";

export const metadata: Metadata = { title: "Payment cancelled", robots: { index: false } };

export default function CancelledPage({ searchParams }: PageProps<"/checkout/cancelled">) {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <Cancelled searchParams={searchParams} />
    </Suspense>
  );
}

/** Customer left Stripe's page without paying: close that payment session and release the stock hold. */
async function Cancelled({ searchParams }: Pick<PageProps<"/checkout/cancelled">, "searchParams">) {
  const raw = (await searchParams).session_id;
  const sessionId = typeof raw === "string" && /^cs_[A-Za-z0-9_]{10,200}$/.test(raw) ? raw : null;
  if (sessionId && isStripeConfigured()) {
    const order = await db.order.findUnique({ where: { stripeCheckoutSessionId: sessionId }, select: { id: true, status: true } });
    if (order?.status === "PENDING_PAYMENT") {
      try {
        const s = await expireCheckoutSession(sessionId);
        if (s.status !== "complete") await cancelPendingOrder(order.id, "Customer cancelled payment");
      } catch (e) {
        console.error("[checkout cancelled]", e); // the expiry webhook / sweeper will release it
      }
    }
  }
  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <h1 className="font-display text-display-md">Payment cancelled</h1>
      <p className="mt-3 text-bark">No money has been taken. Your bag is just as you left it.</p>
      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink href="/checkout">Return to checkout</ButtonLink>
        <ButtonLink href="/cart" variant="outline">
          View bag
        </ButtonLink>
      </div>
    </div>
  );
}
