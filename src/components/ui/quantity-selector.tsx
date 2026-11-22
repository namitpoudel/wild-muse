"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantitySelector({
  value,
  onChange,
  max,
  min = 1,
  label = "Quantity",
  size = "md",
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  max: number;
  min?: number;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const h = size === "sm" ? "h-9" : "h-11";
  return (
    <div className={cn("inline-flex items-center rounded-[2px] border border-sand-deep bg-white/60", h, className)} role="group" aria-label={label}>
      <button
        type="button"
        className="grid h-full w-9 place-items-center disabled:opacity-35"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <output className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className="grid h-full w-9 place-items-center disabled:opacity-35"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
