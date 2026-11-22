"use client";

import { PackageSearch } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

/**
 * Guest order tracking: order number + email must BOTH match (prevents order enumeration).
 * Stage 4 performs the lookup server-side with rate limiting; Stage 5 shows carrier events.
 */
export function TrackOrderForm() {
  const [errors, setErrors] = useState<{ order?: string; email?: string }>({});
  const [result, setResult] = useState<string | null>(null);
  return (
    <div>
      <form
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const order = String(f.get("order") ?? "")
            .trim()
            .toUpperCase();
          const email = String(f.get("email") ?? "").trim();
          const next = {
            order: /^WM-\d{4,}$/.test(order) ? undefined : "Enter your order number, like WM-10042",
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? undefined : "Enter the email used for the order",
          };
          setErrors(next);
          if (next.order || next.email) return;
          setResult(order);
        }}
      >
        <TextField
          label="Order number"
          name="order"
          placeholder="WM-10042"
          autoCapitalize="characters"
          error={errors.order}
          hint="You'll find it in your order confirmation email."
        />
        <TextField label="Email address" name="email" type="email" autoComplete="email" error={errors.email} />
        <Button type="submit" size="lg" block>
          Track order
        </Button>
      </form>
      {result && (
        <div role="status" className="mt-6 flex gap-3 rounded-[2px] bg-cream p-4 text-sm">
          <PackageSearch className="mt-0.5 size-5 shrink-0 text-terracotta" aria-hidden />
          <p>
            Order lookup is connected to the order database in Stage 4, so we can&apos;t show <strong>{result}</strong> yet. Once live, you&apos;ll
            see the order status, dispatch date and the courier&apos;s tracking link here.
          </p>
        </div>
      )}
    </div>
  );
}
