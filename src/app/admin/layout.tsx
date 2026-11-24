import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Suspense } from "react";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/admin-sidebar";
import { SignOutButton } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/server/auth/session";
import { isStaffRole, ROLE_LABELS } from "@/server/auth/permissions";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Wild Muse Admin" }, robots: { index: false, follow: false } };

/**
 * Admin shell. Access control is enforced on the server by every page (requirePermission)
 * and every server action (assertPermission); the proxy only redirects visitors with no session.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f7f3ec]" aria-busy="true" />}>
      <StaffGate>
        <AdminShell>{children}</AdminShell>
      </StaffGate>
    </Suspense>
  );
}

/** Nothing of the admin (not even the menu) renders until a staff session is confirmed. */
async function StaffGate({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isStaffRole(user.role)) notFound();
  return children;
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-[#f7f3ec]">
      <Suspense fallback={<aside className="hidden w-64 shrink-0 bg-chocolate lg:block" />}>
        <AdminSidebar />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-sand bg-linen px-4 md:px-8">
          <form
            action="/admin/orders"
            className="flex h-10 w-full max-w-md items-center gap-2 rounded-[2px] border border-sand-deep bg-white px-3 text-sm"
          >
            <label htmlFor="admin-search" className="sr-only">
              Search orders
            </label>
            <input
              id="admin-search"
              name="q"
              type="search"
              placeholder="Search orders by number, email or name…"
              className="w-full bg-transparent outline-none"
            />
          </form>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden items-center gap-1.5 text-sm hover:underline sm:flex">
              View store <ExternalLink className="size-3.5" aria-hidden />
            </Link>
            <Suspense fallback={<span className="size-9 rounded-full bg-sand" />}>
              <UserBadge />
            </Suspense>
          </div>
        </header>
        <Suspense fallback={<div className="h-11 border-b border-sand lg:hidden" />}>
          <AdminMobileNav />
        </Suspense>
        <main id="main" className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

async function UserBadge() {
  const user = await getCurrentUser();
  if (!user) return null;
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-right text-xs leading-tight md:block">
        <span className="block font-semibold">{user.name}</span>
        <span className="text-bark">{ROLE_LABELS[user.role]}</span>
      </span>
      <span className="grid size-9 place-items-center rounded-full bg-olive text-xs font-bold text-linen" aria-hidden>
        {initials}
      </span>
      <SignOutButton className="text-xs underline underline-offset-4" />
    </div>
  );
}
