import type { Metadata } from "next";
import { Package } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Overview" };

export default function AccountPage() {
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl md:text-4xl">Hello, free spirit</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Orders", "0"],
          ["Wishlist", "0"],
          ["Reviews", "0"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-[2px] bg-cream p-5">
            <p className="eyebrow text-bark">{k}</p>
            <p className="mt-2 font-display text-4xl">{v}</p>
          </div>
        ))}
      </div>
      <section className="rounded-[2px] border border-sand" aria-labelledby="recent-orders">
        <h2 id="recent-orders" className="border-b border-sand px-5 py-4 font-display text-xl">
          Recent orders
        </h2>
        <EmptyState icon={Package} title="No orders yet" action={<ButtonLink href="/new-arrivals">Start shopping</ButtonLink>}>
          When you place an order you can track it here, download invoices and start a return.
        </EmptyState>
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-[2px] border border-sand p-5" aria-labelledby="addr">
          <h2 id="addr" className="font-display text-xl">
            Default delivery address
          </h2>
          <p className="mt-2 text-sm text-bark">No saved addresses. Add one for faster checkout.</p>
          <ButtonLink href="/account/addresses" variant="outline" size="sm" className="mt-4">
            Add address
          </ButtonLink>
        </section>
        <section className="rounded-[2px] border border-sand p-5" aria-labelledby="prefs">
          <h2 id="prefs" className="font-display text-xl">
            Email preferences
          </h2>
          <p className="mt-2 text-sm text-bark">You are not subscribed to marketing emails. Order updates are always sent.</p>
          <ButtonLink href="/account/preferences" variant="outline" size="sm" className="mt-4">
            Manage
          </ButtonLink>
        </section>
      </div>
      <section className="rounded-[2px] bg-cream p-5 text-sm" aria-labelledby="privacy">
        <h2 id="privacy" className="font-display text-xl">
          Your data
        </h2>
        <p className="mt-2 text-bark">
          Download a copy of your data or request account deletion. Order records we must keep for tax purposes are retained as described in our
          privacy policy.
        </p>
      </section>
    </div>
  );
}
