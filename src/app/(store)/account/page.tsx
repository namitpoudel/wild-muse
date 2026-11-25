import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { Suspense } from "react";
import { AccountSkeleton } from "@/components/account/account-skeleton";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPenceExact } from "@/lib/money";
import { getAccountOverview } from "@/server/account";
import { formatOrderNumber } from "@/server/orders/format";

export const metadata: Metadata = { title: "Overview" };

const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const d = await getAccountOverview();
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl md:text-4xl">Hello, {d.user.name.split(" ")[0]}</h1>
      {!d.user.emailVerified && (
        <p className="rounded-[2px] border border-mustard/50 bg-mustard/10 px-4 py-3 text-sm">
          Please confirm your email address — we sent you a link when you registered.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Orders", d.orderCount, "/account/orders"],
          ["Wishlist", d.wishlist, "/wishlist"],
          ["Reviews", d.reviews, "/account/reviews"],
        ].map(([k, v, href]) => (
          <Link key={k} href={String(href)} className="rounded-[2px] bg-cream p-5 transition-colors hover:bg-sand">
            <p className="eyebrow text-bark">{k}</p>
            <p className="mt-2 font-display text-4xl">{v}</p>
          </Link>
        ))}
      </div>
      <section className="rounded-[2px] border border-sand" aria-labelledby="recent-orders">
        <div className="flex items-center justify-between border-b border-sand px-5 py-4">
          <h2 id="recent-orders" className="font-display text-xl">
            Recent orders
          </h2>
          {d.orderCount > 0 && (
            <Link href="/account/orders" className="text-sm font-semibold underline underline-offset-4">
              View all
            </Link>
          )}
        </div>
        {d.orders.length ? (
          <ul className="divide-y divide-sand">
            {d.orders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-cream/60">
                  <span className="font-semibold">{formatOrderNumber(o.orderNumber)}</span>
                  <span className="text-sm text-bark">{date.format(o.placedAt ?? o.createdAt)}</span>
                  <span className="text-sm">{o.items.reduce((n, i) => n + i.quantity, 0)} items</span>
                  <OrderStatusBadge status={o.status} />
                  <span className="font-semibold">{formatPenceExact(o.totalPence)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState headingLevel={3} icon={Package} title="No orders yet" action={<ButtonLink href="/new-arrivals">Start shopping</ButtonLink>}>
            When you place an order you can track it here, download invoices and start a return.
          </EmptyState>
        )}
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-[2px] border border-sand p-5" aria-labelledby="addr">
          <h2 id="addr" className="font-display text-xl">
            Default delivery address
          </h2>
          {d.address ? (
            <address className="mt-2 text-sm not-italic text-bark">
              {d.address.fullName}
              <br />
              {d.address.line1}
              {d.address.line2 && `, ${d.address.line2}`}
              <br />
              {d.address.city} {d.address.postcode}
            </address>
          ) : (
            <p className="mt-2 text-sm text-bark">No saved addresses yet.</p>
          )}
          <ButtonLink href="/account/addresses" variant="outline" size="sm" className="mt-4">
            Manage addresses
          </ButtonLink>
        </section>
        <section className="rounded-[2px] border border-sand p-5" aria-labelledby="prefs">
          <h2 id="prefs" className="font-display text-xl">
            Email preferences
          </h2>
          <p className="mt-2 text-sm text-bark">
            {d.newsletter === "SUBSCRIBED"
              ? "You're subscribed to our newsletter."
              : d.newsletter === "PENDING"
                ? "Please confirm your subscription from the email we sent."
                : "You're not subscribed to marketing emails."}{" "}
            Order updates are always sent.
          </p>
          <ButtonLink href="/account/preferences" variant="outline" size="sm" className="mt-4">
            Manage
          </ButtonLink>
        </section>
      </div>
    </div>
  );
}
