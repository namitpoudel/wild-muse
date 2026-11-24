"use client";

import { PackageSearch } from "lucide-react";
import { useState, useTransition } from "react";
import { trackOrderAction, type TrackResult } from "@/app/actions/track";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";

const STEPS = ["PAID", "PROCESSING", "DISPATCHED", "DELIVERED"];

export function TrackOrderForm() {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [pending, start] = useTransition();
  const stepIndex = result ? STEPS.indexOf(result.status) : -1;
  return (
    <div>
      <form
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          start(async () => {
            const r = await trackOrderAction({ order: String(f.get("order") ?? ""), email: String(f.get("email") ?? "") });
            if (!r.ok) {
              setResult(null);
              return setError(r.error);
            }
            setError(null);
            setResult(r.data);
          });
        }}
      >
        <TextField
          label="Order number"
          name="order"
          placeholder="WM-10042"
          autoCapitalize="characters"
          hint="You'll find it in your order confirmation email."
        />
        <TextField label="Email address" name="email" type="email" autoComplete="email" />
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" block disabled={pending}>
          {pending ? "Looking up…" : "Track order"}
        </Button>
      </form>
      {result && (
        <div role="status" className="mt-6 space-y-4 rounded-[2px] bg-cream p-5 text-sm">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-semibold">
              <PackageSearch className="size-5 text-terracotta" aria-hidden /> {result.number}
            </p>
            <Badge tone={result.status === "CANCELLED" || result.status === "REFUNDED" ? "danger" : "success"}>{result.statusLabel}</Badge>
          </div>
          {stepIndex >= 0 && (
            <ol className="grid grid-cols-4 gap-1 text-center text-[0.7rem]" aria-label="Order progress">
              {["Paid", "Preparing", "Dispatched", "Delivered"].map((s, i) => (
                <li key={s}>
                  <span className={`mb-1 block h-1.5 rounded-full ${i <= stepIndex ? "bg-olive" : "bg-sand-deep"}`} />
                  <span className={i <= stepIndex ? "font-semibold" : "text-bark"}>{s}</span>
                </li>
              ))}
            </ol>
          )}
          {result.placedAt && <p className="text-bark">Placed {result.placedAt}</p>}
          <p>{result.items.join(", ")}</p>
          {result.shipments.map((s, i) => (
            <div key={i} className="border-t border-sand-deep pt-3">
              <p>
                <strong>{s.carrier}</strong> {s.trackingNumber && `· ${s.trackingNumber}`}
              </p>
              {s.trackingUrl && (
                <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-terracotta underline">
                  Track with {s.carrier}
                </a>
              )}
              <ul className="mt-2 space-y-1">
                {s.events.map((e, j) => (
                  <li key={j}>
                    <span className="text-bark">{e.at}</span> — {e.description}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
