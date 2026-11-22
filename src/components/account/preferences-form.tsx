"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";

export function PreferencesForm() {
  return (
    <form
      className="space-y-5 rounded-[2px] border border-sand p-5 md:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        toast.info("Email preferences are connected in Stage 4 — nothing was saved yet.");
      }}
    >
      <Checkbox name="news" label="New collections and artisan stories" description="Roughly twice a month." />
      <Checkbox name="offers" label="Offers and early sale access" />
      <p className="text-xs text-bark">
        Order confirmations, dispatch and refund emails are always sent — they are part of your order, not marketing.
      </p>
      <Button type="submit">Save preferences</Button>
    </form>
  );
}
