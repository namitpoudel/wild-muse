"use client";

import { Truck } from "lucide-react";
import { useConfig } from "@/components/config-provider";
import { formatPence } from "@/lib/money";

export function FreeDeliveryMeter({ subtotalPence }: { subtotalPence: number }) {
  const threshold = useConfig().freeDeliveryThresholdPence;
  if (threshold === null) return null;
  const remaining = Math.max(0, threshold - subtotalPence);
  const pct = Math.min(100, Math.round((subtotalPence / threshold) * 100));
  return (
    <div className="rounded-[2px] bg-cream p-3.5">
      <p className="flex items-center gap-2 text-sm">
        <Truck className="size-4 shrink-0 text-olive" aria-hidden />
        {remaining > 0 ? (
          <span>
            Spend <strong>{formatPence(remaining)}</strong> more for <strong>free UK delivery</strong>
          </span>
        ) : (
          <span>
            <strong className="text-olive-deep">You&apos;ve unlocked free UK standard delivery</strong>
          </span>
        )}
      </p>
      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-sand"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Progress towards free delivery"
      >
        <div className="h-full rounded-full bg-olive transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
