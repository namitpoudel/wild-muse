import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { SignOutButton } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: { default: "My account", template: "%s | My account" }, robots: { index: false } };

/**
 * Customer account shell. The proxy sends visitors without a session cookie to sign-in;
 * each page then verifies the session on the server before loading any data.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-10 md:py-14">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <nav aria-label="Account" className="lg:col-span-3">
          <p className="eyebrow mb-4 text-bark">My account</p>
          <Suspense fallback={<div className="h-72" />}>
            <AccountNav />
          </Suspense>
          <SignOutButton className="mt-4 px-3 text-sm text-bark underline underline-offset-4 hover:text-chocolate" />
        </nav>
        <div className="min-w-0 lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
