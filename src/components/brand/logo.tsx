import Link from "next/link";
import { cn } from "@/lib/utils";

/** Sun-over-the-Himalaya mark used in the wordmark, favicon and social images. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-8", className)} aria-hidden>
      <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="15" r="5.5" fill="var(--color-mustard)" />
      <path d="M5 29 L14 18 L19 24 L25 14 L35 29 Z" fill="currentColor" />
      <path d="M8 33 H32" stroke="var(--color-terracotta)" strokeWidth="2" strokeDasharray="2.5 2" />
    </svg>
  );
}

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link
      href="/"
      aria-label="Wild Muse — home"
      className={cn("inline-flex items-center gap-2.5", tone === "light" ? "text-linen" : "text-chocolate", className)}
    >
      <LogoMark className="size-7 md:size-8" />
      <span className="font-display text-[1.35rem] font-medium leading-none tracking-[0.22em] md:text-[1.55rem]">WILD MUSE</span>
    </Link>
  );
}
