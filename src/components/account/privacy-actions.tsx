"use client";

import { Download, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteAccountAction } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/field";

/** UK GDPR rights: data access/portability and erasure (with password + typed confirmation). */
export function PrivacyActions() {
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-6">
      <section className="rounded-[2px] border border-sand p-5 md:p-6">
        <h2 className="font-display text-xl">Download your data</h2>
        <p className="mt-2 text-sm text-bark">Get a copy of your account details, addresses, orders, reviews and preferences as a JSON file.</p>
        <a
          href="/api/account/export"
          download
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-[2px] border border-chocolate/80 px-6 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-chocolate hover:text-linen"
        >
          <Download className="size-4" aria-hidden /> Download my data
        </a>
      </section>
      <section className="rounded-[2px] border border-danger/30 p-5 md:p-6">
        <h2 className="font-display text-xl">Delete your account</h2>
        <p className="mt-2 text-sm text-bark">
          This permanently deletes your account, addresses, wishlist and preferences, and anonymises your reviews. We must keep order and invoice
          records for 6 years for tax purposes, without using them for marketing.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-4 border-danger text-danger hover:bg-danger hover:text-white">
              <Trash2 /> Delete my account
            </Button>
          </DialogTrigger>
          <DialogContent title="Delete your account?" description="This can't be undone.">
            <div className="space-y-4">
              {error && (
                <p role="alert" className="text-sm font-medium text-danger">
                  {error}
                </p>
              )}
              <TextField
                label="Your password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <TextField label="Type DELETE to confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                disabled={confirm !== "DELETE" || !password || pending}
                className="bg-danger hover:bg-danger/90"
                onClick={() =>
                  start(async () => {
                    const r = await deleteAccountAction({ password, confirm });
                    if (!r.ok) return setError(r.error);
                    toast.success(r.message);
                    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload after an auth change so no signed-out prefetch is reused
                    window.location.assign("/");
                  })
                }
              >
                Permanently delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
