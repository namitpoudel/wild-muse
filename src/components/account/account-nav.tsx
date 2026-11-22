"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, Mail, MapPin, Package, ShieldCheck, Star } from "lucide-react";

const nav = [
  { href: "/account", label: "Overview", Icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders & tracking", Icon: Package },
  { href: "/account/addresses", label: "Addresses", Icon: MapPin },
  { href: "/wishlist", label: "Wishlist", Icon: Heart },
  { href: "/account/reviews", label: "My reviews", Icon: Star },
  { href: "/account/preferences", label: "Email preferences", Icon: Mail },
  { href: "/account/privacy", label: "Privacy & data", Icon: ShieldCheck },
];

export function AccountNav() {
  const path = usePathname();
  return (
    <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 scrollbar-none lg:mx-0 lg:flex-col lg:px-0">
      {nav.map(({ href, label, Icon }) => (
        <li key={href}>
          <Link
            href={href}
            aria-current={path === href ? "page" : undefined}
            className="flex items-center gap-3 whitespace-nowrap rounded-[2px] px-3 py-2.5 text-sm hover:bg-sand aria-[current=page]:bg-chocolate aria-[current=page]:text-linen"
          >
            <Icon className="size-4" aria-hidden /> {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
