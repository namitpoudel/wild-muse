"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Megaphone,
  Package,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  Users,
  Factory,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

export const adminNav = [
  {
    group: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
      { href: "/admin/reports", label: "Reports", Icon: BarChart3 },
    ],
  },
  {
    group: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", Icon: ShoppingCart },
      { href: "/admin/customers", label: "Customers", Icon: Users },
      { href: "/admin/discounts", label: "Discount codes", Icon: Tag },
      { href: "/admin/reviews", label: "Reviews", Icon: Star },
    ],
  },
  {
    group: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", Icon: Package },
      { href: "/admin/inventory", label: "Inventory", Icon: Boxes },
      { href: "/admin/collections", label: "Categories & collections", Icon: ClipboardList },
    ],
  },
  {
    group: "Sourcing",
    items: [
      { href: "/admin/suppliers", label: "Suppliers", Icon: Factory },
      { href: "/admin/purchase-orders", label: "Purchase orders", Icon: FileText },
      { href: "/admin/shipments", label: "Import shipments", Icon: Truck },
    ],
  },
  {
    group: "Website",
    items: [
      { href: "/admin/content", label: "Pages & policies", Icon: ImageIcon },
      { href: "/admin/content/homepage", label: "Homepage & announcements", Icon: Megaphone },
    ],
  },
  {
    group: "Settings",
    items: [
      { href: "/admin/settings", label: "Store settings", Icon: Settings },
      { href: "/admin/staff", label: "Staff & roles", Icon: ShieldCheck },
      { href: "/admin/audit-log", label: "Audit log", Icon: ScrollText },
    ],
  },
];

/** The nav item whose href is the longest prefix of the current path is the active one. */
function useActive() {
  const path = usePathname();
  const all = adminNav.flatMap((g) => g.items.map((i) => i.href));
  const best = all.filter((h) => path === h || path.startsWith(`${h}/`)).sort((a, b) => b.length - a.length)[0];
  return (href: string) => href === best;
}

export function AdminSidebar() {
  const active = useActive();
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-chocolate text-sand lg:flex">
      <Link href="/admin" className="flex items-center gap-2.5 px-5 py-5 text-linen">
        <LogoMark className="size-7" />
        <span className="font-display text-lg tracking-[0.2em]">WILD MUSE</span>
      </Link>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-6">
        {adminNav.map((g) => (
          <div key={g.group} className="mt-5">
            <p className="eyebrow mb-1.5 px-2 text-[0.65rem] text-sand-deep/80">{g.group}</p>
            <ul>
              {g.items.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    prefetch={false}
                    aria-current={active(href) ? "page" : undefined}
                    className="flex items-center gap-3 rounded-[2px] px-2 py-2 text-sm hover:bg-white/8 hover:text-linen aria-[current=page]:bg-white/12 aria-[current=page]:text-linen"
                  >
                    <Icon className="size-4" aria-hidden /> {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

/** Compact navigation for phones/tablets (the sidebar is desktop-only). */
export function AdminMobileNav() {
  const active = useActive();
  return (
    <nav aria-label="Admin sections" className="border-b border-sand bg-linen lg:hidden">
      <ul className="flex gap-1 overflow-x-auto px-3 py-2 scrollbar-none">
        {adminNav
          .flatMap((g) => g.items)
          .map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                prefetch={false}
                aria-current={active(href) ? "page" : undefined}
                className="block whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold aria-[current=page]:bg-chocolate aria-[current=page]:text-linen"
              >
                {label}
              </Link>
            </li>
          ))}
      </ul>
    </nav>
  );
}
