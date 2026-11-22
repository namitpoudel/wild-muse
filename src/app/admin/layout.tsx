import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, ExternalLink, Search } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Wild Muse Admin" }, robots: { index: false, follow: false } };

/**
 * Admin shell. Until authentication + role checks land in Stage 4, the admin UI is
 * only rendered when ENABLE_UI_PREVIEW=1 so an unprotected admin is never deployed.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (process.env.ENABLE_UI_PREVIEW !== "1") notFound();
  return (
    <div className="flex min-h-dvh bg-[#f7f3ec]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-sand bg-linen px-4 md:px-8">
          <label className="flex h-10 w-full max-w-md items-center gap-2 rounded-[2px] border border-sand-deep bg-white px-3 text-sm">
            <Search className="size-4 text-bark" aria-hidden />
            <span className="sr-only">Search orders, products and customers</span>
            <input type="search" placeholder="Search orders, products, customers…" className="w-full bg-transparent outline-none" />
          </label>
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden items-center gap-1.5 text-sm hover:underline sm:flex">
              View store <ExternalLink className="size-3.5" aria-hidden />
            </Link>
            <button type="button" className="grid size-10 place-items-center rounded-full hover:bg-sand" aria-label="Notifications">
              <Bell className="size-4.5" />
            </button>
            <span className="grid size-9 place-items-center rounded-full bg-olive text-xs font-bold text-linen" aria-label="Signed in as Owner (preview)">
              OW
            </span>
          </div>
        </header>
        <main id="main" className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
