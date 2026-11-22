import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, Package, ShieldCheck, Star, Mail, LayoutDashboard } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

const nav = [
  { href: "/account", label: "Overview", Icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders & tracking", Icon: Package },
  { href: "/account/addresses", label: "Addresses", Icon: MapPin },
  { href: "/wishlist", label: "Wishlist", Icon: Heart },
  { href: "/account/reviews", label: "My reviews", Icon: Star },
  { href: "/account/preferences", label: "Email preferences", Icon: Mail },
  { href: "/account/privacy", label: "Privacy & data", Icon: ShieldCheck },
];

/**
 * Customer dashboard layout (Stage 2 design). Stage 4 adds authentication and
 * real data; every section below then renders the signed-in customer's records.
 */
export default function AccountPage() {
  return (
    <div className="container-page py-10 md:py-14">
      <p className="mb-6 rounded-[2px] border border-mustard/50 bg-mustard/10 px-4 py-3 text-sm">
        <strong>Design preview.</strong> Sign-in, registration and saved data are connected in Stage 4.
      </p>
      <div className="grid gap-10 lg:grid-cols-12">
        <nav aria-label="Account" className="lg:col-span-3">
          <p className="eyebrow mb-2 text-bark">My account</p>
          <h1 className="mb-6 font-display text-3xl">Hello, free spirit</h1>
          <ul className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col">
            {nav.map(({ href, label, Icon }, i) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={i === 0 ? "page" : undefined}
                  className="flex items-center gap-3 whitespace-nowrap rounded-[2px] px-3 py-2.5 text-sm hover:bg-sand aria-[current=page]:bg-chocolate aria-[current=page]:text-linen"
                >
                  <Icon className="size-4" aria-hidden /> {label}
                </Link>
              </li>
            ))}
          </ul>
          <button type="button" className="mt-4 px-3 text-sm text-bark underline underline-offset-4">
            Sign out
          </button>
        </nav>
        <div className="space-y-8 lg:col-span-9">
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
              Download a copy of your data or request account deletion. Order records we must keep for tax purposes are retained as described in our privacy policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
