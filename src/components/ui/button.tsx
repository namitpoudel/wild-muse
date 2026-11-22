import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold uppercase tracking-[0.14em] transition-[background-color,color,border-color,transform,box-shadow] duration-200 ease-[var(--ease-soft)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-terracotta text-white hover:bg-terracotta-deep shadow-soft",
        dark: "bg-chocolate text-linen hover:bg-[#2a1910]",
        olive: "bg-olive text-white hover:bg-olive-deep",
        outline: "border border-chocolate/80 text-chocolate hover:bg-chocolate hover:text-linen",
        "outline-light": "border border-linen/80 text-linen hover:bg-linen hover:text-chocolate",
        light: "bg-linen text-chocolate hover:bg-cream",
        ghost: "text-chocolate hover:bg-sand/60 normal-case tracking-normal font-medium",
        link: "text-terracotta underline-offset-4 hover:underline normal-case tracking-normal p-0 h-auto",
      },
      size: {
        sm: "h-9 px-4 text-[0.7rem] rounded-[2px]",
        md: "h-11 px-6 text-xs rounded-[2px]",
        lg: "h-13 px-8 text-[0.8rem] rounded-[2px]",
        icon: "size-10 rounded-full p-0 normal-case tracking-normal",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, block, type = "button", ...props }: ComponentProps<"button"> & ButtonVariantProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size, block }), className)} {...props} />;
}

export function ButtonLink({ className, variant, size, block, ...props }: ComponentProps<typeof Link> & ButtonVariantProps) {
  return <Link className={cn(buttonVariants({ variant, size, block }), className)} {...props} />;
}
