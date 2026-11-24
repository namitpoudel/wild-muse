"use client";

import * as A from "@radix-ui/react-accordion";
import Link from "next/link";
import { ChevronDown, Heart, Menu, Search, User } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import type { NavItem } from "@/config/navigation";
import { useConfig } from "@/components/config-provider";
import { cn } from "@/lib/utils";

export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const config = useConfig();
  const close = () => setOpen(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="grid size-10 place-items-center rounded-full hover:bg-sand/60 lg:hidden" aria-label="Open menu">
        <Menu className="size-5.5" />
      </DialogTrigger>
      <SheetContent title="Menu" side="left">
        <nav aria-label="Mobile" className="flex-1 overflow-y-auto">
          <form action="/search" className="border-b border-sand p-4" onSubmit={close}>
            <label className="flex h-11 items-center gap-2 rounded-[2px] border border-sand-deep bg-white/70 px-3">
              <Search className="size-4 text-bark" aria-hidden />
              <span className="sr-only">Search products</span>
              <input name="q" type="search" placeholder="Search dresses, scarves, wool…" className="w-full bg-transparent text-sm outline-none" />
            </label>
          </form>
          <A.Root type="single" collapsible className="divide-y divide-sand">
            {items.map((item) =>
              item.groups ? (
                <A.Item key={item.label} value={item.label}>
                  <A.Trigger className="group flex w-full items-center justify-between px-5 py-4 text-sm font-bold uppercase tracking-[0.12em]">
                    {item.label}
                    <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
                  </A.Trigger>
                  <A.Content className="overflow-hidden bg-cream/70 px-5 pb-5">
                    <Link href={item.href} onClick={close} className="block py-2.5 text-sm font-semibold text-terracotta">
                      Shop all {item.label}
                    </Link>
                    {item.groups.map((g) => (
                      <div key={g.name} className="mt-3">
                        <p className="eyebrow mb-1 text-bark">{g.name}</p>
                        <ul>
                          {g.links.map((l) => (
                            <li key={l.href}>
                              <Link href={l.href} onClick={close} className="block py-2 text-[0.95rem]">
                                {l.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </A.Content>
                </A.Item>
              ) : (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className={cn("block px-5 py-4 text-sm font-bold uppercase tracking-[0.12em]", item.highlight && "text-terracotta")}
                  >
                    {item.label}
                  </Link>
                </div>
              ),
            )}
          </A.Root>
          <div className="grid grid-cols-2 gap-2 border-t border-sand p-4 text-sm">
            <Link href="/account" onClick={close} className="flex items-center gap-2 rounded-[2px] bg-cream px-3 py-3">
              <User className="size-4" /> Account
            </Link>
            <Link href="/wishlist" onClick={close} className="flex items-center gap-2 rounded-[2px] bg-cream px-3 py-3">
              <Heart className="size-4" /> Wishlist
            </Link>
          </div>
          <p className="px-5 pb-8 text-xs text-bark">
            Need help?{" "}
            <a className="underline" href={`mailto:${config.contactEmail}`}>
              {config.contactEmail}
            </a>
          </p>
        </nav>
      </SheetContent>
    </Dialog>
  );
}
