"use client";

import { Lock, ShoppingBag, Tag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { MediaImage } from "@/components/brand/artwork";
import { useStore } from "@/components/cart/store-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, TextArea, TextField } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import { formatPenceExact } from "@/lib/money";
import { isValidUkPostcode, normaliseUkPostcode } from "@/lib/postcode";
import { cn } from "@/lib/utils";

type Method = "standard" | "express";
type Errors = Partial<Record<string, string>>;

/**
 * Checkout UI. Totals shown here are an ESTIMATE for display. In Stage 4/5 the
 * server re-prices the cart, validates the coupon and stock, reserves inventory,
 * creates the order and redirects to Stripe Checkout. Payment is confirmed only by
 * the verified Stripe webhook.
 */
export function CheckoutForm() {
  const { lines, subtotalPence, ready } = useStore();
  const [method, setMethod] = useState<Method>("standard");
  const [billingSame, setBillingSame] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const c = siteConfig.commerce;

  if (!ready) return <Skeleton className="h-[32rem]" />;
  if (!lines.length)
    return (
      <EmptyState icon={ShoppingBag} title="Your bag is empty" action={<ButtonLink href="/">Continue shopping</ButtonLink>}>
        Add something you love, then come back to checkout.
      </EmptyState>
    );

  const freeStandard = subtotalPence >= c.freeDeliveryThresholdPence;
  const deliveryPence = method === "express" ? c.expressDeliveryPence : freeStandard ? 0 : c.standardDeliveryPence;
  const total = subtotalPence + deliveryPence;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const next: Errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get("email"))) next.email = "Enter a valid email address, like name@example.com";
    if (!get("fullName")) next.fullName = "Enter the recipient's full name";
    if (!get("line1")) next.line1 = "Enter the first line of the address";
    if (!get("city")) next.city = "Enter a town or city";
    if (!isValidUkPostcode(get("postcode"))) next.postcode = "Enter a valid UK postcode, like SW1A 1AA";
    if (!billingSame) {
      if (!get("billingLine1")) next.billingLine1 = "Enter the billing address";
      if (!isValidUkPostcode(get("billingPostcode"))) next.billingPostcode = "Enter a valid UK postcode";
    }
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error("Please check the highlighted fields.");
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    toast.info("Details look good. Secure payment with Stripe is connected in Stage 5 — no order was placed.");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-12">
      <div className="space-y-10 lg:col-span-7">
        <Step n={1} title="Contact">
          <TextField label="Email" name="email" type="email" autoComplete="email" error={errors.email} hint="For your order confirmation and delivery updates." />
          <p className="text-sm text-bark">
            Have an account?{" "}
            <Link href="/login?next=/checkout" className="font-semibold text-terracotta underline underline-offset-4">
              Sign in
            </Link>{" "}
            for faster checkout — or continue as a guest.
          </p>
          <Checkbox name="marketing" label="Email me about new collections and offers" description="Optional. Unsubscribe at any time." />
        </Step>

        <Step n={2} title="Delivery address">
          <p className="text-sm text-bark">We currently deliver to UK addresses only.</p>
          <TextField label="Full name" name="fullName" autoComplete="shipping name" error={errors.fullName} />
          <TextField label="Address line 1" name="line1" autoComplete="shipping address-line1" error={errors.line1} />
          <TextField label="Address line 2" name="line2" autoComplete="shipping address-line2" optional />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Town or city" name="city" autoComplete="shipping address-level2" error={errors.city} />
            <TextField label="County" name="county" autoComplete="shipping address-level1" optional />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Postcode"
              name="postcode"
              autoComplete="shipping postal-code"
              autoCapitalize="characters"
              error={errors.postcode}
              onBlur={(e) => (e.currentTarget.value = normaliseUkPostcode(e.currentTarget.value))}
              className="sm:max-w-48"
            />
            <TextField label="Phone" name="phone" type="tel" autoComplete="shipping tel" optional hint="Only used by the courier if needed." />
          </div>
          <TextArea label="Delivery instructions" name="instructions" optional hint="e.g. leave with neighbour at no. 12" maxLength={250} />
        </Step>

        <Step n={3} title="Delivery method">
          <fieldset className="space-y-3">
            <legend className="sr-only">Choose a delivery method</legend>
            {(
              [
                { id: "standard", label: "UK Standard", eta: "2–4 working days", price: freeStandard ? 0 : c.standardDeliveryPence },
                { id: "express", label: "UK Express", eta: "Next working day if ordered by 1pm", price: c.expressDeliveryPence },
              ] as const
            ).map((m) => (
              <label
                key={m.id}
                className={cn(
                  "flex cursor-pointer items-center gap-4 rounded-[2px] border p-4 transition-colors",
                  method === m.id ? "border-chocolate bg-cream" : "border-sand-deep hover:border-bark",
                )}
              >
                <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="size-4 accent-terracotta" />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className="block text-xs text-bark">{m.eta}</span>
                </span>
                <span className="text-sm font-semibold">{m.price === 0 ? "Free" : formatPenceExact(m.price)}</span>
              </label>
            ))}
          </fieldset>
        </Step>

        <Step n={4} title="Billing & payment">
          <Checkbox checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} label="Billing address is the same as delivery" />
          {!billingSame && (
            <div className="space-y-4 rounded-[2px] border border-sand p-4">
              <TextField label="Billing address line 1" name="billingLine1" autoComplete="billing address-line1" error={errors.billingLine1} />
              <TextField label="Billing postcode" name="billingPostcode" autoComplete="billing postal-code" error={errors.billingPostcode} className="sm:max-w-48" />
            </div>
          )}
          <div className="flex items-start gap-3 rounded-[2px] bg-cream p-4 text-sm">
            <Lock className="mt-0.5 size-4 shrink-0 text-olive" aria-hidden />
            <p>
              You&apos;ll pay on Stripe&apos;s secure page — card, Apple Pay or Google Pay. Wild Muse never sees or stores your card details.
            </p>
          </div>
          <p className="text-xs text-bark">
            By placing your order you agree to our{" "}
            <Link href="/pages/terms" className="underline">
              Terms & Conditions
            </Link>{" "}
            and acknowledge our{" "}
            <Link href="/pages/privacy" className="underline">
              Privacy Policy
            </Link>
            . You have the right to cancel within 14 days of receiving your order.
          </p>
          <Button type="submit" size="lg" block>
            <Lock aria-hidden /> Continue to secure payment · {formatPenceExact(total)}
          </Button>
        </Step>
      </div>

      <aside className="h-fit rounded-[2px] bg-cream p-6 lg:sticky lg:top-24 lg:col-span-5" aria-label="Order summary">
        <h2 className="font-display text-2xl">Order summary</h2>
        <ul className="my-5 space-y-4">
          {lines.map((l) => (
            <li key={l.variantId} className="flex items-center gap-3">
              <div className="relative w-14 shrink-0 overflow-hidden rounded-[2px]">
                <div className="aspect-[4/5]">
                  <MediaImage media={{ ...l.image, alt: "" }} />
                </div>
                <span className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-chocolate text-[0.65rem] font-bold text-linen">{l.quantity}</span>
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{l.name}</p>
                <p className="text-xs text-bark">
                  {l.colour} · {l.size}
                </p>
              </div>
              <span className="text-sm font-semibold">{formatPenceExact(l.unitPricePence * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 border-y border-sand-deep py-4">
          <label htmlFor="coupon" className="sr-only">
            Discount code
          </label>
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bark" aria-hidden />
            <input id="coupon" name="coupon" placeholder="Discount code" className="h-11 w-full rounded-[2px] border border-sand-deep bg-linen pl-9 pr-3 text-sm uppercase placeholder:normal-case" />
          </div>
          <Button variant="outline" onClick={() => toast.info("Discount codes are validated on the server from Stage 4.")}>
            Apply
          </Button>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPenceExact(subtotalPence)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{deliveryPence === 0 ? "Free" : formatPenceExact(deliveryPence)}</dd>
          </div>
          <div className="flex justify-between border-t border-sand-deep pt-3 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatPenceExact(total)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-bark">Prices include VAT where applicable. VAT is shown on your invoice.</p>
      </aside>
    </form>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`step-${n}`} className="space-y-4">
      <h2 id={`step-${n}`} className="flex items-center gap-3 font-display text-2xl">
        <span className="grid size-8 place-items-center rounded-full bg-chocolate font-sans text-sm font-bold text-linen">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
