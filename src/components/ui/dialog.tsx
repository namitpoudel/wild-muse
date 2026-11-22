"use client";

import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

/** Centred modal (size guide, confirmations, ask-a-question). Focus trap + Escape handled by Radix. */
export function DialogContent({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-chocolate/45 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[3px] bg-linen p-6 shadow-lift data-[state=open]:animate-fade-up md:p-8",
          className,
        )}
      >
        <D.Title className="pr-8 font-display text-2xl">{title}</D.Title>
        {description ? (
          <D.Description className="mt-1.5 text-sm text-bark">{description}</D.Description>
        ) : (
          <D.Description className="sr-only">{title}</D.Description>
        )}
        <div className="mt-5">{children}</div>
        <D.Close className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-chocolate hover:bg-sand" aria-label="Close">
          <X className="size-5" />
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}

/** Off-canvas drawer (mobile nav, cart, filters). */
export function SheetContent({
  title,
  side = "right",
  children,
  className,
  hideTitle,
}: {
  title: string;
  side?: "left" | "right";
  children: ReactNode;
  className?: string;
  hideTitle?: boolean;
}) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-chocolate/45 data-[state=open]:animate-fade-in" />
      <D.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-[min(26rem,calc(100vw-2.5rem))] flex-col bg-linen shadow-lift",
          side === "right" ? "right-0 data-[state=open]:animate-slide-in-right" : "left-0 data-[state=open]:animate-slide-in-left",
          className,
        )}
      >
        <div className={cn("flex items-center justify-between border-b border-sand px-5 py-4", hideTitle && "sr-only")}>
          <D.Title className="eyebrow text-chocolate">{title}</D.Title>
          <D.Close className="grid size-9 place-items-center rounded-full hover:bg-sand" aria-label="Close">
            <X className="size-5" />
          </D.Close>
        </div>
        <D.Description className="sr-only">{title}</D.Description>
        {children}
      </D.Content>
    </D.Portal>
  );
}
