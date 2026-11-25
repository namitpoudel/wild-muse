"use client";

import * as A from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Accordion({
  items,
  defaultOpen,
  className,
  headingLevel = 3,
}: {
  items: { id: string; title: ReactNode; content: ReactNode }[];
  defaultOpen?: string[];
  className?: string;
  /** Heading level of each trigger, so the page outline doesn't skip levels. */
  headingLevel?: 2 | 3 | 4;
}) {
  const H = `h${headingLevel}` as const;
  return (
    <A.Root type="multiple" defaultValue={defaultOpen} className={cn("divide-y divide-sand border-y border-sand", className)}>
      {items.map((item) => (
        <A.Item key={item.id} value={item.id}>
          <A.Header asChild>
            <H>
              <A.Trigger className="group flex w-full items-center justify-between py-4 text-left text-xs font-bold uppercase tracking-[0.14em]">
                {item.title}
                <Plus className="size-4 transition-transform duration-300 group-data-[state=open]:rotate-45" aria-hidden />
              </A.Trigger>
            </H>
          </A.Header>
          <A.Content className="overflow-hidden pb-5 text-sm leading-relaxed text-bark">{item.content}</A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}
