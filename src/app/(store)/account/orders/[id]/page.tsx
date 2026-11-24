import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccountSkeleton } from "@/components/account/account-skeleton";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { formatPenceExact } from "@/lib/money";
import { getMyOrder } from "@/server/account";
import { formatOrderNumber } from "@/server/orders/format";

export const metadata: Metadata = { title: "Order details" };
const dt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function OrderDetailPage({ params }: PageProps<"/account/orders/[id]">) {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Detail params={params} />
    </Suspense>
  );
}

type Addr = { fullName: string; line1: string; line2?: string | null; city: string; county?: string | null; postcode: string };

async function Detail({ params }: Pick<PageProps<"/account/orders/[id]">, "params">) {
  const { id } = await params;
  const o = await getMyOrder(id.slice(0, 40));
  if (!o) notFound();
  const ship = o.shippingAddress as unknown as Addr;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/account/orders" className="text-sm underline underline-offset-4">
            ← All orders
          </Link>
          <h1 className="mt-2 font-display text-3xl">{formatOrderNumber(o.orderNumber)}</h1>
          <p className="text-sm text-bark">Placed {dt.format(o.placedAt ?? o.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={o.status} />
          <Link href={`/invoice/${o.id}`} className="text-sm font-semibold underline">
            Download invoice
          </Link>
        </div>
      </div>

      {o.shipments.length > 0 && (
        <section className="rounded-[2px] border border-sand p-5" aria-labelledby="tracking">
          <h2 id="tracking" className="font-display text-xl">
            Delivery
          </h2>
          {o.shipments.map((s) => (
            <div key={s.id} className="mt-3 text-sm">
              <p>
                <strong>{s.carrier}</strong> {s.service && `· ${s.service}`} {s.trackingNumber && `· ${s.trackingNumber}`}
              </p>
              {s.trackingUrl && (
                <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-terracotta underline">
                  Track with {s.carrier}
                </a>
              )}
              {s.events.length > 0 && (
                <ol className="mt-3 space-y-1 border-l-2 border-sand pl-4">
                  {s.events.map((e) => (
                    <li key={e.id}>
                      <span className="text-bark">{dt.format(e.occurredAt)}</span> — {e.description}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </section>
      )}

      <section aria-labelledby="items" className="rounded-[2px] border border-sand">
        <h2 id="items" className="border-b border-sand px-5 py-4 font-display text-xl">
          Items
        </h2>
        <ul className="divide-y divide-sand">
          {o.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 px-5 py-3 text-sm">
              <span>
                <Link href={`/products/${i.productSlug}`} className="font-medium hover:underline">
                  {i.productName}
                </Link>
                <span className="block text-bark">
                  {i.colour} · {i.size} · Qty {i.quantity}
                </span>
              </span>
              <span className="font-semibold">{formatPenceExact(i.unitPricePence * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-sand px-5 py-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPenceExact(o.subtotalPence)}</dd>
          </div>
          {o.discountPence > 0 && (
            <div className="flex justify-between">
              <dt>Discount {o.couponCode && `(${o.couponCode})`}</dt>
              <dd>−{formatPenceExact(o.discountPence)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Delivery ({o.shippingMethodName})</dt>
            <dd>{o.shippingPence ? formatPenceExact(o.shippingPence) : "Free"}</dd>
          </div>
          <div className="flex justify-between font-bold">
            <dt>Total</dt>
            <dd>{formatPenceExact(o.totalPence)}</dd>
          </div>
          {o.refunds
            .filter((r) => r.status === "SUCCEEDED")
            .map((r) => (
              <div key={r.id} className="flex justify-between text-terracotta">
                <dt>Refunded</dt>
                <dd>−{formatPenceExact(r.amountPence)}</dd>
              </div>
            ))}
        </dl>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[2px] border border-sand p-5 text-sm">
          <h2 className="font-display text-xl">Delivering to</h2>
          <address className="mt-2 not-italic text-bark">
            {ship.fullName}
            <br />
            {ship.line1}
            {ship.line2 && `, ${ship.line2}`}
            <br />
            {ship.city} {ship.postcode}
          </address>
        </div>
        <div className="rounded-[2px] bg-cream p-5 text-sm">
          <h2 className="font-display text-xl">Need to return something?</h2>
          <p className="mt-2 text-bark">
            You can cancel within 14 days of receiving your order. See{" "}
            <Link href="/pages/returns" className="underline">
              Returns & Refunds
            </Link>{" "}
            or{" "}
            <Link href="/pages/contact" className="underline">
              contact us
            </Link>{" "}
            quoting {formatOrderNumber(o.orderNumber)}.
          </p>
        </div>
      </section>
    </div>
  );
}
