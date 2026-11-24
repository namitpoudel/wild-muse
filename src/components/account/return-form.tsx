"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { requestReturnAction } from "@/app/actions/returns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TextArea } from "@/components/ui/field";

export function ReturnForm({
  orderId,
  items,
  statutory,
  daysLeft,
}: {
  orderId: string;
  items: { id: string; label: string; max: number }[];
  statutory: boolean;
  daysLeft: number;
}) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-3">
          Start a return
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Start a return"
        description={
          statutory
            ? "You're within your 14-day legal right to cancel — no reason is required, but it helps us improve."
            : `${daysLeft} days left in our returns window.`
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const reason = String(new FormData(e.currentTarget).get("reason") ?? "");
            start(async () => {
              const r = await requestReturnAction({
                orderId,
                lines: Object.entries(qty).map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
                reason,
              });
              if (!r.ok) return setError(r.error);
              toast.success(r.message);
              setOpen(false);
              router.refresh();
            });
          }}
        >
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold">Items to return</legend>
            {items.map((i) => (
              <label key={i.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{i.label}</span>
                <select
                  value={qty[i.id] ?? 0}
                  onChange={(e) => setQty({ ...qty, [i.id]: Number(e.target.value) })}
                  className="h-9 rounded-[2px] border border-sand-deep px-2"
                  aria-label={`Quantity of ${i.label} to return`}
                >
                  {Array.from({ length: i.max + 1 }, (_, n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </fieldset>
          <TextArea label="Reason" name="reason" maxLength={500} hint="e.g. too small, changed my mind, faulty" />
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" block disabled={pending}>
            {pending ? "Sending…" : "Request return"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
