"use client";

import * as NM from "@radix-ui/react-navigation-menu";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Artwork } from "@/components/brand/artwork";
import type { NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

const trigger =
  "relative inline-flex h-full items-center whitespace-nowrap px-2.5 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-chocolate transition-colors hover:text-terracotta data-[state=open]:text-terracotta xl:px-3.5 after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-terracotta after:transition-transform data-[state=open]:after:scale-x-100 hover:after:scale-x-100";

/**
 * Desktop mega-menu. Radix NavigationMenu provides arrow-key navigation,
 * Escape to close and correct aria-expanded wiring.
 */
export function DesktopNav({ items }: { items: NavItem[] }) {
  return (
    <NM.Root className="hidden h-full lg:flex" delayDuration={80} aria-label="Main">
      <NM.List className="flex h-full items-stretch">
        {items.map((item) =>
          item.groups ? (
            <NM.Item key={item.label} className="flex">
              <NM.Trigger className={trigger}>{item.label}</NM.Trigger>
              <NM.Content className="absolute inset-x-0 top-full border-t border-sand bg-linen shadow-lift data-[state=open]:animate-fade-in">
                <div className="container-page grid grid-cols-12 gap-8 py-10">
                  <div className="col-span-8 grid grid-cols-3 gap-8">
                    {item.groups.map((g) => (
                      <div key={g.name}>
                        <p className="eyebrow mb-4 text-bark">{g.name}</p>
                        <ul className="space-y-2.5">
                          {g.links.map((l) => (
                            <li key={l.href}>
                              <NM.Link asChild>
                                <Link
                                  href={l.href}
                                  className="text-[0.95rem] text-chocolate hover:text-terracotta hover:underline underline-offset-4"
                                >
                                  {l.label}
                                </Link>
                              </NM.Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <div className="col-span-3 border-t border-sand pt-5">
                      <NM.Link asChild>
                        <Link
                          href={item.href}
                          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] hover:text-terracotta"
                        >
                          Shop all {item.label} <ArrowRight className="size-4" />
                        </Link>
                      </NM.Link>
                    </div>
                  </div>
                  {item.feature && (
                    <NM.Link asChild>
                      <Link href={item.feature.href} className="group col-span-4 block">
                        <div className="aspect-[5/4] overflow-hidden rounded-[2px]">
                          <Artwork
                            kind={item.feature.kind}
                            tone={item.feature.tone}
                            label=""
                            className="transition-transform duration-700 group-hover:scale-[1.03]"
                          />
                        </div>
                        <p className="mt-3 font-display text-xl group-hover:text-terracotta">{item.feature.title}</p>
                        <p className="text-sm text-bark">{item.feature.caption}</p>
                      </Link>
                    </NM.Link>
                  )}
                </div>
              </NM.Content>
            </NM.Item>
          ) : (
            <NM.Item key={item.label} className="flex">
              <NM.Link asChild>
                <Link href={item.href} className={cn(trigger, item.highlight && "text-terracotta")}>
                  {item.label}
                </Link>
              </NM.Link>
            </NM.Item>
          ),
        )}
      </NM.List>
    </NM.Root>
  );
}
