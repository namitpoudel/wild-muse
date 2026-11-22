import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[2px] px-2 py-1 text-[0.65rem] font-bold uppercase leading-none tracking-[0.14em]",
  {
    variants: {
      tone: {
        sale: "bg-terracotta text-white",
        new: "bg-chocolate text-linen",
        handmade: "bg-linen/95 text-olive-deep ring-1 ring-olive/30",
        neutral: "bg-sand text-chocolate",
        success: "bg-success/12 text-success",
        warning: "bg-warning/12 text-warning",
        danger: "bg-danger/10 text-danger",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({ className, tone, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
