import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { Suspense } from "react";
import { AccountSkeleton } from "@/components/account/account-skeleton";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPenceExact } from "@/lib/money";
import { getMyOrders } from "@/server/account";
import { formatOrderNumber } from "@/server/orders/format";

export const metadata: Metadata = { title: "Orders" };
const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function OrdersPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl">Orders & tracking</h1>
      <Suspense fallback={<AccountSkeleton />}>
        <OrderList />
      </Suspense>
    </div>
  );
}

async function OrderList() {
  const orders = await getMyOrders();
  if (!orders.length)
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        className="rounded-[2px] border border-sand"
        action={<ButtonLink href="/new-arrivals">Start shopping</ButtonLink>}
      >
        Your orders will appear here with live status, tracking links, invoices and returns.
      </EmptyState>
    );
  return (
    <ul className="space-y-4">
      {orders.map((o) => {
        const tracking = o.shipments.find((s) => s.trackingUrl);
        return (
          <li key={o.id} className="rounded-[2px] border border-sand p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{formatOrderNumber(o.orderNumber)}</p>
                <p className="text-sm text-bark">Placed {date.format(o.placedAt ?? o.createdAt)}</p>
              </div>
              <OrderStatusBadge status={o.status} />
              <p className="font-semibold">{formatPenceExact(o.totalPence)}</p>
            </div>
            <p className="mt-3 text-sm text-bark">{o.items.map((i) => `${i.quantity} × ${i.productName}`).join(", ")}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <ButtonLink href={`/account/orders/${o.id}`} size="sm" variant="outline">
                View details
              </ButtonLink>
              {tracking?.trackingUrl && (
                <a
                  href={tracking.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center text-sm font-semibold underline"
                >
                  Track parcel
                </a>
              )}
              <Link href={`/invoice/${o.id}`} className="inline-flex h-9 items-center text-sm underline">
                Invoice
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
