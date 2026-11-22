"use client";

import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/field";

/** UK GDPR rights: data access/portability and erasure (with confirmation step). */
export function PrivacyActions() {
  const [confirm, setConfirm] = useState("");
  return (
    <div className="space-y-6">
      <section className="rounded-[2px] border border-sand p-5 md:p-6">
        <h2 className="font-display text-xl">Download your data</h2>
        <p className="mt-2 text-sm text-bark">Get a copy of your account details, addresses, orders, reviews and preferences as a JSON file.</p>
        <Button variant="outline" className="mt-4" onClick={() => toast.info("Data export is connected in Stage 4.")}>
          <Download /> Request download
        </Button>
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
          <DialogContent title="Delete your account?" description="This can't be undone. Type DELETE to confirm.">
            <TextField label="Type DELETE" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
            <div className="mt-5 flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                disabled={confirm !== "DELETE"}
                className="bg-danger hover:bg-danger/90"
                onClick={() => toast.info("Account deletion requests are connected in Stage 4.")}
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
