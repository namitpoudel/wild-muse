"use client";

import { useState, useTransition } from "react";
import { sendEnquiryAction } from "@/app/actions/enquiries";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SelectField, TextArea, TextField } from "@/components/ui/field";

type Errors = Partial<Record<"name" | "email" | "message" | "business", string>>;

/**
 * Contact / wholesale enquiry form with client validation.
 * Posts to a rate-limited server action that emails the shop inbox (honeypot field for spam).
 */
export function EnquiryForm({ kind }: { kind: "contact" | "wholesale" }) {
  const [errors, setErrors] = useState<Errors>({});
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const next: Errors = {};
    if (!v("name")) next.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) next.email = "Enter a valid email address";
    if (kind === "wholesale" && !v("business")) next.business = "Enter your business name";
    if (v("message").length < 10) next.message = "Please write a little more (at least 10 characters)";
    setErrors(next);
    if (Object.keys(next).length) return;
    const payload = Object.fromEntries([...f.entries()].map(([k, val]) => [k, String(val)]));
    start(async () => {
      const r = await sendEnquiryAction({ ...payload, kind });
      if (!r.ok) return setErrors((r.fieldErrors ?? {}) as Errors);
      setSent(true);
      toast.success(r.message);
    });
  }
  return (
    <form onSubmit={onSubmit} noValidate className="not-prose my-8 grid max-w-2xl gap-4 rounded-[2px] bg-cream p-5 sm:grid-cols-2 md:p-7">
      <TextField label="Your name" name="name" autoComplete="name" error={errors.name} />
      <TextField label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
      {kind === "wholesale" ? (
        <>
          <TextField label="Business name" name="business" autoComplete="organization" error={errors.business} />
          <TextField label="Website or social link" name="website" optional />
          <SelectField label="Type of business" name="type" className="sm:col-span-2">
            <option>Independent boutique</option>
            <option>Festival / market trader</option>
            <option>Online shop</option>
            <option>Other</option>
          </SelectField>
        </>
      ) : (
        <>
          <TextField label="Order number" name="order" optional placeholder="WM-10001" />
          <SelectField label="Topic" name="topic">
            <option>Question about a product</option>
            <option>My order</option>
            <option>Returns & refunds</option>
            <option>Something else</option>
          </SelectField>
        </>
      )}
      <TextArea label="Message" name="message" error={errors.message} className="sm:col-span-2" maxLength={2000} />
      {/* Honeypot: hidden from people, tempting to bots. Checked server-side. */}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <p className="text-xs text-bark sm:col-span-2">We use your details only to reply to your enquiry. See our privacy policy.</p>
      <Button type="submit" className="sm:col-span-2 sm:justify-self-start" disabled={pending || sent}>
        {sent ? "Message sent" : pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
