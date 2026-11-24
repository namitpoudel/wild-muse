"use client";

import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteAddressAction, saveAddressAction } from "@/app/actions/account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, TextField } from "@/components/ui/field";

export interface AddressRow {
  id: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  phone: string | null;
  isDefault: boolean;
}

function AddressForm({ initial, onDone }: { initial?: AddressRow; onDone: () => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const v = (k: string) => String(f.get(k) ?? "");
        start(async () => {
          const res = await saveAddressAction({
            id: initial?.id,
            fullName: v("fullName"),
            line1: v("line1"),
            line2: v("line2"),
            city: v("city"),
            county: v("county"),
            postcode: v("postcode"),
            phone: v("phone"),
            isDefault: f.get("isDefault") === "on",
            country: "GB",
          });
          if (!res.ok) return setErrors(res.fieldErrors ?? { form: res.error });
          toast.success(res.message);
          onDone();
          router.refresh();
        });
      }}
    >
      {errors.form && <p className="text-sm text-danger">{errors.form}</p>}
      <TextField label="Full name" name="fullName" autoComplete="name" defaultValue={initial?.fullName} error={errors.fullName} />
      <TextField label="Address line 1" name="line1" autoComplete="address-line1" defaultValue={initial?.line1} error={errors.line1} />
      <TextField label="Address line 2" name="line2" autoComplete="address-line2" defaultValue={initial?.line2 ?? ""} optional />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Town or city" name="city" autoComplete="address-level2" defaultValue={initial?.city} error={errors.city} />
        <TextField label="County" name="county" autoComplete="address-level1" defaultValue={initial?.county ?? ""} optional />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Postcode" name="postcode" autoComplete="postal-code" defaultValue={initial?.postcode} error={errors.postcode} />
        <TextField label="Phone" name="phone" type="tel" autoComplete="tel" defaultValue={initial?.phone ?? ""} optional error={errors.phone} />
      </div>
      <Checkbox name="isDefault" defaultChecked={initial?.isDefault} label="Use as my default delivery address" />
      <Button type="submit" block disabled={pending}>
        {pending ? "Saving…" : "Save address"}
      </Button>
    </form>
  );
}

export function AddressBook({ addresses }: { addresses: AddressRow[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AddressRow | null>(null);
  const router = useRouter();
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
            <AddressForm onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      {addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="No saved addresses" className="rounded-[2px] border border-sand">
          Save your delivery and billing addresses for a faster checkout.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-[2px] border border-sand p-5">
              {a.isDefault && <Badge tone="success">Default</Badge>}
              <address className="mt-2 text-sm not-italic">
                <strong>{a.fullName}</strong>
                <br />
                {a.line1}
                {a.line2 && <>, {a.line2}</>}
                <br />
                {a.city}
                {a.county && `, ${a.county}`}
                <br />
                {a.postcode}
                {a.phone && (
                  <>
                    <br />
                    {a.phone}
                  </>
                )}
              </address>
              <div className="mt-4 flex gap-4 text-sm">
                <button type="button" onClick={() => setEditing(a)} className="inline-flex items-center gap-1 underline">
                  <Pencil className="size-3.5" aria-hidden /> Edit
                </button>
                <Dialog>
                  <DialogTrigger className="inline-flex items-center gap-1 text-danger underline">
                    <Trash2 className="size-3.5" aria-hidden /> Remove
                  </DialogTrigger>
                  <DialogContent title="Remove this address?" description={`${a.line1}, ${a.postcode}`}>
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button variant="outline">Keep</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button
                          onClick={async () => {
                            const r = await deleteAddressAction(a.id);
                            if (r.ok) toast.success(r.message);
                            router.refresh();
                          }}
                        >
                          Remove
                        </Button>
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <DialogContent title="Edit address">
            <AddressForm initial={editing} onDone={() => setEditing(null)} />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
