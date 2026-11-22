import type { Metadata } from "next";
import { AccountNav } from "@/components/account/account-nav";

export const metadata: Metadata = { title: { default: "My account", template: "%s | My account | WILD MUSE" }, robots: { index: false } };

/**
 * Customer account shell. Stage 4 adds a server-side session check here that
 * redirects signed-out visitors to /login?next=… before any data is loaded.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-10 md:py-14">
      <p className="mb-6 rounded-[2px] border border-mustard/50 bg-mustard/10 px-4 py-3 text-sm">
        <strong>Design preview.</strong> Sign-in and saved account data are connected in Stage 4.
      </p>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <nav aria-label="Account" className="lg:col-span-3">
          <p className="eyebrow mb-4 text-bark">My account</p>
          <AccountNav />
          <button type="button" className="mt-4 px-3 text-sm text-bark underline underline-offset-4">
            Sign out
          </button>
        </nav>
        <div className="min-w-0 lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
