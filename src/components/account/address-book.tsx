"use client";

import { MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, TextField } from "@/components/ui/field";
import { isValidUkPostcode } from "@/lib/postcode";

export function AddressBook() {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Addresses</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus /> Add address
            </Button>
          </DialogTrigger>
          <DialogContent title="Add a UK address">
            <form
              noValidate
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const v = (k: string) => String(f.get(k) ?? "").trim();
                const next = {
                  fullName: v("fullName") ? undefined : "Enter a name",
                  line1: v("line1") ? undefined : "Enter the first line of the address",
                  city: v("city") ? undefined : "Enter a town or city",
                  postcode: isValidUkPostcode(v("postcode")) ? undefined : "Enter a valid UK postcode",
                };
                setErrors(next);
                if (Object.values(next).some(Boolean)) return;
                toast.info("Saved addresses are connected in Stage 4 — nothing was saved yet.");
                setOpen(false);
              }}
            >
              <TextField label="Full name" name="fullName" autoComplete="name" error={errors.fullName} />
              <TextField label="Address line 1" name="line1" autoComplete="address-line1" error={errors.line1} />
              <TextField label="Address line 2" name="line2" autoComplete="address-line2" optional />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Town or city" name="city" autoComplete="address-level2" error={errors.city} />
                <TextField label="Postcode" name="postcode" autoComplete="postal-code" error={errors.postcode} />
              </div>
              <Checkbox name="default" label="Use as my default delivery address" />
              <Button type="submit" block>
                Save address
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <EmptyState icon={MapPin} title="No saved addresses" className="rounded-[2px] border border-sand">
        Save your delivery and billing addresses for a faster checkout.
      </EmptyState>
    </div>
  );
}
