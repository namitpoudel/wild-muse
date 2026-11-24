"use client";

import { AlertTriangle, Lock, ShoppingBag, Tag, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { applyCouponAction, removeCouponAction } from "@/app/actions/cart";
import { getCheckoutDefaultsAction, placeOrderAction, quoteCheckoutAction, type CheckoutDefaults, type CheckoutQuote } from "@/app/actions/checkout";
import { MediaImage } from "@/components/brand/artwork";
import { useStore } from "@/components/cart/store-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, SelectField, TextArea, TextField } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPenceExact } from "@/lib/money";
import { normaliseUkPostcode } from "@/lib/postcode";
import { cn } from "@/lib/utils";

type Errors = Record<string, string>;
const ADDRESS_FIELDS = ["fullName", "line1", "line2", "city", "county", "postcode", "phone"] as const;

/**
 * Checkout. Every number shown here comes from the server (quoteCheckoutAction), which
 * re-prices the bag, validates the coupon and applies delivery/VAT rules. Placing the
 * order re-validates everything again and reserves stock in a transaction.
 */
export function CheckoutForm() {
  const { lines, ready, setCart, refresh } = useStore();
  const router = useRouter();
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [defaults, setDefaults] = useState<CheckoutDefaults | null>(null);
  const [method, setMethod] = useState<string | undefined>();
  const [email, setEmail] = useState("");
  const [billingSame, setBillingSame] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [addressKey, setAddressKey] = useState(0);
  const [prefill, setPrefill] = useState<Record<string, string>>({});
  const [placing, startPlacing] = useTransition();

  const loadQuote = useCallback(async (code?: string, mail?: string) => {
    setQuote(await quoteCheckoutAction({ shippingCode: code, email: mail }));
  }, []);

  useEffect(() => {
    if (!ready) return;
    void getCheckoutDefaultsAction().then((d) => {
      setDefaults(d);
      setEmail((e) => e || d.email);
      const a = d.addresses[0];
      if (a) {
        setPrefill(Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, a[k] ?? ""])));
        setAddressKey((k) => k + 1);
      }
    });
  }, [ready]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- server quote refresh when bag or delivery method changes
    if (ready) void loadQuote(method, email);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- email is applied on blur to avoid a request per keystroke
  }, [ready, lines, method, loadQuote]);

  if (!ready || (lines.length && !quote)) return <Skeleton className="h-[32rem]" />;
  if (!lines.length)
    return (
      <EmptyState icon={ShoppingBag} title="Your bag is empty" action={<ButtonLink href="/">Continue shopping</ButtonLink>}>
        Add something you love, then come back to checkout.
      </EmptyState>
    );

  async function applyCoupon() {
    setCouponMsg(null);
    const res = await applyCouponAction({ code: coupon, email });
    if (!res.ok) return setCouponMsg(res.error);
    setCart(res.data);
    setCoupon("");
    toast.success(res.message ?? "Code applied");
    void loadQuote(method, email);
  }
  async function removeCoupon() {
    const res = await removeCouponAction();
    if (res.ok) setCart(res.data);
    void loadQuote(method, email);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const addr = (prefix: string) => Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, String(f.get(`${prefix}.${k}`) ?? "")]));
    const payload = {
      email,
      shipping: { ...addr("shipping"), country: "GB" },
      billingSame,
      billing: billingSame ? undefined : { ...addr("billing"), country: "GB" },
      shippingCode: quote?.methods.find((m) => m.selected)?.code ?? "",
      instructions: String(f.get("instructions") ?? ""),
      marketingOptIn: f.get("marketing") === "on",
    };
    setFormError(null);
    startPlacing(async () => {
      const res = await placeOrderAction(payload);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
        await refresh();
        setTimeout(() => document.querySelector<HTMLElement>("[aria-invalid=true], #checkout-error")?.focus(), 50);
        return;
      }
      router.push(res.data.redirectUrl);
    });
  }

  const q = quote!;
  const addressFields = (prefix: "shipping" | "billing", autoPrefix: string) => (
    <div key={`${prefix}-${addressKey}`} className="space-y-4">
      <TextField
        label="Full name"
        name={`${prefix}.fullName`}
        autoComplete={`${autoPrefix} name`}
        defaultValue={prefix === "shipping" ? (prefill.fullName ?? defaults?.name) : ""}
        error={errors[`${prefix}.fullName`]}
      />
      <TextField
        label="Address line 1"
        name={`${prefix}.line1`}
        autoComplete={`${autoPrefix} address-line1`}
        defaultValue={prefix === "shipping" ? prefill.line1 : ""}
        error={errors[`${prefix}.line1`]}
      />
      <TextField
        label="Address line 2"
        name={`${prefix}.line2`}
        autoComplete={`${autoPrefix} address-line2`}
        defaultValue={prefix === "shipping" ? prefill.line2 : ""}
        optional
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Town or city"
          name={`${prefix}.city`}
          autoComplete={`${autoPrefix} address-level2`}
          defaultValue={prefix === "shipping" ? prefill.city : ""}
          error={errors[`${prefix}.city`]}
        />
        <TextField
          label="County"
          name={`${prefix}.county`}
          autoComplete={`${autoPrefix} address-level1`}
          defaultValue={prefix === "shipping" ? prefill.county : ""}
          optional
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Postcode"
          name={`${prefix}.postcode`}
          autoComplete={`${autoPrefix} postal-code`}
          autoCapitalize="characters"
          defaultValue={prefix === "shipping" ? prefill.postcode : ""}
          error={errors[`${prefix}.postcode`]}
          onBlur={(ev) => (ev.currentTarget.value = normaliseUkPostcode(ev.currentTarget.value))}
          className="sm:max-w-48"
        />
        {prefix === "shipping" && (
          <TextField
            label="Phone"
            name="shipping.phone"
            type="tel"
            autoComplete="shipping tel"
            defaultValue={prefill.phone}
            optional
            hint="Only used by the courier if needed."
            error={errors["shipping.phone"]}
          />
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-12">
      <div className="space-y-10 lg:col-span-7">
        {formError && (
          <p
            id="checkout-error"
            tabIndex={-1}
            role="alert"
            className="flex gap-3 rounded-[2px] border border-danger/40 bg-danger/5 p-4 text-sm text-danger"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {formError}
          </p>
        )}
        {q.blocking.length > 0 && (
          <div role="alert" className="rounded-[2px] border border-warning/40 bg-warning/5 p-4 text-sm">
            <p className="font-semibold">Some items need your attention:</p>
            <ul className="mt-1 list-disc pl-5">
              {q.blocking.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <Link href="/cart" className="mt-2 inline-block font-semibold underline">
              Update your bag
            </Link>
          </div>
        )}
        <Step n={1} title="Contact">
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => q.couponCode && void loadQuote(method, email)}
            error={errors.email}
            hint="For your order confirmation and delivery updates."
          />
          {!defaults?.signedIn && (
            <p className="text-sm text-bark">
              Have an account?{" "}
              <Link href="/login?next=/checkout" className="font-semibold text-terracotta underline underline-offset-4">
                Sign in
              </Link>{" "}
              for faster checkout — or continue as a guest.
            </p>
          )}
          <Checkbox name="marketing" label="Email me about new collections and offers" description="Optional. Unsubscribe at any time." />
        </Step>

        <Step n={2} title="Delivery address">
          <p className="text-sm text-bark">We currently deliver to UK addresses only.</p>
          {defaults && defaults.addresses.length > 1 && (
            <SelectField
              label="Use a saved address"
              onChange={(e) => {
                const a = defaults.addresses.find((x) => x.id === e.target.value);
                if (a) {
                  setPrefill(Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, a[k] ?? ""])));
                  setAddressKey((k) => k + 1);
                }
              }}
            >
              {defaults.addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName}, {a.line1}, {a.postcode}
                </option>
              ))}
            </SelectField>
          )}
          {addressFields("shipping", "shipping")}
          <TextArea label="Delivery instructions" name="instructions" optional hint="e.g. leave with neighbour at no. 12" maxLength={250} />
        </Step>

        <Step n={3} title="Delivery method">
          <fieldset className="space-y-3">
            <legend className="sr-only">Choose a delivery method</legend>
            {q.methods.map((m) => (
              <label
                key={m.code}
                className={cn(
                  "flex cursor-pointer items-center gap-4 rounded-[2px] border p-4 transition-colors",
                  m.selected ? "border-chocolate bg-cream" : "border-sand-deep hover:border-bark",
                )}
              >
                <input
                  type="radio"
                  name="method"
                  value={m.code}
                  checked={m.selected}
                  onChange={() => setMethod(m.code)}
                  className="size-4 accent-terracotta"
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{m.name}</span>
                  <span className="block text-xs text-bark">{m.description}</span>
                </span>
                <span className="text-sm font-semibold">{m.effectivePence === 0 ? "Free" : formatPenceExact(m.effectivePence)}</span>
              </label>
            ))}
          </fieldset>
        </Step>

        <Step n={4} title="Billing & payment">
          <Checkbox checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} label="Billing address is the same as delivery" />
          {!billingSame && <div className="rounded-[2px] border border-sand p-4">{addressFields("billing", "billing")}</div>}
          <div className="flex items-start gap-3 rounded-[2px] bg-cream p-4 text-sm">
            <Lock className="mt-0.5 size-4 shrink-0 text-olive" aria-hidden />
            <p>You&apos;ll pay on Stripe&apos;s secure page — card, Apple Pay or Google Pay. Wild Muse never sees or stores your card details.</p>
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
          <Button type="submit" size="lg" block disabled={placing || q.blocking.length > 0}>
            <Lock aria-hidden /> {placing ? "Placing order…" : `Continue to secure payment · ${formatPenceExact(q.totalPence)}`}
          </Button>
        </Step>
      </div>

      <aside className="h-fit rounded-[2px] bg-cream p-6 lg:sticky lg:top-24 lg:col-span-5" aria-label="Order summary">
        <h2 className="font-display text-2xl">Order summary</h2>
        <ul className="my-5 space-y-4">
          {lines.map((l) => (
            <li key={l.variantId} className={cn("flex items-center gap-3", l.issue && "opacity-60")}>
              <div className="relative w-14 shrink-0 overflow-hidden rounded-[2px]">
                <div className="aspect-[4/5]">
                  <MediaImage media={{ ...l.image, alt: "" }} />
                </div>
                <span className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-chocolate text-[0.65rem] font-bold text-linen">
                  {l.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{l.name}</p>
                <p className="text-xs text-bark">
                  {l.colour} · {l.size}
                  {l.issue && <span className="font-semibold text-danger"> · {l.issue}</span>}
                </p>
              </div>
              <span className="text-sm font-semibold">{formatPenceExact(l.unitPricePence * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="border-y border-sand-deep py-4">
          {q.couponCode ? (
            <p className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 font-semibold">
                <Tag className="size-4" aria-hidden /> {q.couponCode}
              </span>
              <button type="button" onClick={removeCoupon} className="inline-flex items-center gap-1 text-xs underline">
                <X className="size-3.5" aria-hidden /> Remove
              </button>
            </p>
          ) : (
            <div className="flex gap-2">
              <label htmlFor="coupon" className="sr-only">
                Discount code
              </label>
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bark" aria-hidden />
                <input
                  id="coupon"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void applyCoupon();
                    }
                  }}
                  placeholder="Discount code"
                  maxLength={32}
                  className="h-11 w-full rounded-[2px] border border-sand-deep bg-linen pl-9 pr-3 text-sm uppercase placeholder:normal-case"
                  aria-describedby={couponMsg ? "coupon-msg" : undefined}
                />
              </div>
              <Button variant="outline" onClick={applyCoupon} disabled={!coupon.trim()}>
                Apply
              </Button>
            </div>
          )}
          {(couponMsg || q.couponNote) && (
            <p id="coupon-msg" role="alert" className="mt-2 text-xs font-medium text-danger">
              {couponMsg ?? q.couponNote}
            </p>
          )}
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPenceExact(q.subtotalPence)}</dd>
          </div>
          {q.discountPence > 0 && (
            <div className="flex justify-between text-terracotta">
              <dt>Discount</dt>
              <dd>−{formatPenceExact(q.discountPence)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{q.shippingPence === 0 ? "Free" : formatPenceExact(q.shippingPence)}</dd>
          </div>
          <div className="flex justify-between border-t border-sand-deep pt-3 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatPenceExact(q.totalPence)}</dd>
          </div>
          {q.vatRegistered && (
            <div className="flex justify-between text-xs text-bark">
              <dt>Includes VAT of</dt>
              <dd>{formatPenceExact(q.taxPence)}</dd>
            </div>
          )}
        </dl>
        {!q.vatRegistered && <p className="mt-2 text-xs text-bark">All prices are final — no VAT is added at checkout.</p>}
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
