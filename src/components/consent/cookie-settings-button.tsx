"use client";

import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/consent";
import { cn } from "@/lib/utils";

export function CookieSettingsButton({ className, label = "Change cookie settings" }: { className?: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
      className={cn("font-semibold text-terracotta underline underline-offset-4 hover:text-terracotta-deep", className)}
    >
      {label}
    </button>
  );
}
