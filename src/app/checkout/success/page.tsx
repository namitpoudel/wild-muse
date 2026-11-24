import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { Suspense } from "react";
import { PaymentStatusPoller } from "@/components/checkout/payment-status-poller";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPenceExact } from "@/lib/money";
import { clearCart, peekCartId } from "@/server/cart/cart";
import { db } from "@/server/db";
import { formatOrderNumber } from "@/server/orders/format";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false } };

export default function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Confirmation searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * Shown after Stripe redirects back. This page NEVER marks an order as paid — it only reads
 * the status the verified webhook has recorded, and polls briefly while that arrives.
 */
async function Confirmation({ searchParams }: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const raw = (await searchParams).session_id;
  const sessionId = typeof raw === "string" && /^cs_[A-Za-z0-9_]{10,200}$/.test(raw) ? raw : null;
  const order = sessionId ? await db.order.findUnique({ where: { stripeCheckoutSessionId: sessionId }, include: { items: true } }) : null;
  if (!order)
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <h1 className="font-display text-3xl">We couldn&apos;t find that order</h1>
        <p className="mt-3 text-bark">
          If you&apos;ve paid, your confirmation email is on its way. You can also{" "}
          <Link href="/track-order" className="underline">
            track your order
          </Link>
          .
        </p>
      </div>
    );

  // The customer completed Stripe's payment page — empty their bag.
  const cartId = await peekCartId();
  if (cartId) await clearCart(cartId);

  const paid = !["PENDING_PAYMENT", "CANCELLED"].includes(order.status);
  return (
    <div className="mx-auto max-w-2xl py-6 text-center">
      <PaymentStatusPoller done={paid} />
      {paid ? <CheckCircle2 className="mx-auto size-14 text-olive" aria-hidden /> : <Clock className="mx-auto size-14 text-mustard" aria-hidden />}
      <h1 className="mt-4 font-display text-display-md">{paid ? "Thank you — your order is confirmed" : "Confirming your payment…"}</h1>
      <p className="mt-3 text-bark" role="status">
        {paid
          ? `Order ${formatOrderNumber(order.orderNumber)} is paid. We've emailed a confirmation to ${order.email}.`
          : "This usually takes a few seconds. You can safely leave this page — we'll email you as soon as the payment is confirmed."}
      </p>
      <div className="mx-auto mt-8 max-w-md rounded-[2px] bg-cream p-5 text-left text-sm">
        <p className="font-semibold">{formatOrderNumber(order.orderNumber)}</p>
        <ul className="mt-2 space-y-1">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span>
                {i.quantity} × {i.productName}{" "}
                <span className="text-bark">
                  ({i.colour}, {i.size})
                </span>
              </span>
              <span>{formatPenceExact(i.unitPricePence * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-sand-deep pt-2 font-bold">
          <span>Total</span>
          <span>{formatPenceExact(order.totalPence)}</span>
        </p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/track-order" variant="outline">
          Track your order
        </ButtonLink>
        <ButtonLink href="/new-arrivals">Continue shopping</ButtonLink>
      </div>
    </div>
  );
}
