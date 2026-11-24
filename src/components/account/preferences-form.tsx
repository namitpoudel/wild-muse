"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfileAction } from "@/app/actions/account";
import { setMarketingPreferenceAction } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { Checkbox, TextField } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";

export function PreferencesForm({
  name,
  email,
  phone,
  newsletter,
}: {
  name: string;
  email: string;
  phone: string | null;
  newsletter: string | null;
}) {
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  return (
    <div className="space-y-6">
      <form
        className="space-y-4 rounded-[2px] border border-sand p-5 md:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          start(async () => {
            const r = await updateProfileAction({ name: String(f.get("name") ?? ""), phone: String(f.get("phone") ?? "") });
            if (!r.ok) return setErrors(r.fieldErrors ?? {});
            setErrors({});
            toast.success(r.message);
            router.refresh();
          });
        }}
      >
        <h2 className="font-display text-xl">Your details</h2>
        <TextField label="Full name" name="name" defaultValue={name} autoComplete="name" error={errors.name} />
        <TextField label="Email" value={email} readOnly disabled hint="Contact us to change the email on your account." />
        <TextField label="Phone" name="phone" type="tel" defaultValue={phone ?? ""} optional autoComplete="tel" error={errors.phone} />
        <Button type="submit" disabled={pending}>
          Save details
        </Button>
      </form>

      <form
        className="space-y-4 rounded-[2px] border border-sand p-5 md:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const subscribed = new FormData(e.currentTarget).get("news") === "on";
          start(async () => {
            const r = await setMarketingPreferenceAction(subscribed);
            if (r.ok) toast.success(r.message);
            else toast.error(r.error);
            router.refresh();
          });
        }}
      >
        <h2 className="font-display text-xl">Email preferences</h2>
        <Checkbox
          name="news"
          defaultChecked={newsletter === "SUBSCRIBED" || newsletter === "PENDING"}
          label="New collections, artisan stories and offers"
          description={newsletter === "PENDING" ? "Awaiting your confirmation — check your inbox." : "Roughly twice a month. Unsubscribe any time."}
        />
        <p className="text-xs text-bark">
          Order confirmations, dispatch and refund emails are always sent — they are part of your order, not marketing.
        </p>
        <Button type="submit" disabled={pending}>
          Save preferences
        </Button>
      </form>

      <form
        className="space-y-4 rounded-[2px] border border-sand p-5 md:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          const current = String(f.get("current") ?? "");
          const next = String(f.get("next") ?? "");
          if (next.length < 10) return setPwErrors({ next: "Use at least 10 characters" });
          setPwErrors({});
          start(async () => {
            const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
            if (error)
              return setPwErrors({
                current: error.code === "INVALID_PASSWORD" ? "That password isn't correct" : "Couldn't change password — please try again",
              });
            form.reset();
            toast.success("Password changed. Other devices have been signed out.");
          });
        }}
      >
        <h2 className="font-display text-xl">Change password</h2>
        <TextField label="Current password" name="current" type="password" autoComplete="current-password" error={pwErrors.current} />
        <TextField
          label="New password"
          name="next"
          type="password"
          autoComplete="new-password"
          error={pwErrors.next}
          hint="At least 10 characters."
        />
        <Button type="submit" variant="outline" disabled={pending}>
          Change password
        </Button>
      </form>
    </div>
  );
}
