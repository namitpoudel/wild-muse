"use server";

import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { getCartIdForCheckout } from "@/server/cart/cart";
import { db } from "@/server/db";
import { CheckoutError, createPendingOrder, quoteCart } from "@/server/orders/orders";
import { rateLimit } from "@/server/security/rate-limit";
import { getSettings } from "@/server/settings";
import { emailSchema, ukAddressSchema, type UkAddress } from "@/lib/validation";
import { fail, ok, zodFieldErrors, type ActionResult } from "./result";

export interface CheckoutQuote {
  subtotalPence: number;
  discountPence: number;
  shippingPence: number;
  taxPence: number;
  totalPence: number;
  freeShipping: boolean;
  couponCode: string | null;
  couponNote: string | null;
  vatRegistered: boolean;
  methods: {
    code: string;
    name: string;
    description: string;
    pricePence: number;
    freeOverPence: number | null;
    selected: boolean;
    effectivePence: number;
  }[];
  blocking: string[];
}

/** Server-calculated totals for the checkout summary. */
export async function quoteCheckoutAction(input: { shippingCode?: string; email?: string }): Promise<CheckoutQuote | null> {
  const cartId = await getCartIdForCheckout();
  if (!cartId) return null;
  const email = emailSchema.safeParse(input.email ?? "");
  const q = await quoteCart(cartId, { shippingCode: input.shippingCode, email: email.success ? email.data : null });
  const settings = await getSettings();
  const after = q.totals.subtotalPence - q.totals.discountPence;
  return {
    ...q.totals,
    couponCode: q.coupon?.code ?? null,
    couponNote: q.couponNote,
    vatRegistered: settings.tax.vatRegistered,
    blocking: q.blocking.map((l) => `${l.name} (${l.colour}, ${l.size}): ${l.issue}`),
    methods: q.methods.map((m) => ({
      code: m.code,
      name: m.name,
      description: m.description ?? "",
      pricePence: m.pricePence,
      freeOverPence: m.freeOverPence,
      selected: m.code === q.method?.code,
      effectivePence: q.coupon?.type === "FREE_SHIPPING" || (m.freeOverPence !== null && after >= m.freeOverPence) ? 0 : m.pricePence,
    })),
  };
}

export interface CheckoutDefaults {
  email: string;
  name: string;
  signedIn: boolean;
  addresses: (UkAddress & { id: string; isDefault: boolean })[];
}

export async function getCheckoutDefaultsAction(): Promise<CheckoutDefaults> {
  const user = await getCurrentUser();
  if (!user) return { email: "", name: "", signedIn: false, addresses: [] };
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  return {
    email: user.email,
    name: user.name,
    signedIn: true,
    addresses: addresses.map((a) => ({
      id: a.id,
      isDefault: a.isDefault,
      fullName: a.fullName,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      county: a.county,
      postcode: a.postcode,
      phone: a.phone,
      country: "GB" as const,
    })),
  };
}

const placeOrderSchema = z.object({
  email: emailSchema,
  shipping: ukAddressSchema,
  billingSame: z.boolean(),
  billing: ukAddressSchema.optional(),
  shippingCode: z.string().min(1).max(40),
  instructions: z.string().trim().max(250).optional(),
  marketingOptIn: z.boolean(),
});

/**
 * Place the order: validates everything server-side, re-prices the cart, reserves stock and
 * creates a PENDING_PAYMENT order. Stage 5 then redirects to Stripe Checkout; the order is
 * only marked paid by the verified Stripe webhook.
 */
export async function placeOrderAction(input: unknown): Promise<ActionResult<{ redirectUrl: string }>> {
  const rl = await rateLimit("checkout", { max: 10, windowSeconds: 300 });
  if (!rl.ok) return fail("Too many attempts. Please wait a few minutes and try again.");

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", zodFieldErrors(parsed.error.issues));
  const d = parsed.data;
  if (!d.billingSame && !d.billing) return fail("Please enter a billing address.", { billing: "Enter a billing address" });

  const settings = await getSettings();
  const user = await getCurrentUser();
  if (!user && !settings.commerce.allowGuestCheckout) return fail("Please sign in to check out.");

  if (!process.env.STRIPE_SECRET_KEY) {
    // Honest guard: never create orders we can't take payment for.
    return fail("Online payment is not connected yet (Stage 5). Your bag has been kept — no order was placed and nothing was charged.");
  }

  const cartId = await getCartIdForCheckout();
  if (!cartId) return fail("Your bag is empty.");
  try {
    const order = await createPendingOrder({
      cartId,
      email: d.email,
      userId: user?.id ?? null,
      shippingAddress: d.shipping,
      billingAddress: d.billingSame ? d.shipping : d.billing!,
      shippingCode: d.shippingCode,
      deliveryInstructions: d.instructions || null,
      marketingOptIn: d.marketingOptIn,
    });
    // Stage 5: create the Stripe Checkout Session for `order` and return its URL.
    return ok({ redirectUrl: `/checkout/pending?order=${order.id}` });
  } catch (e) {
    if (e instanceof CheckoutError) return fail(e.message);
    console.error("[checkout]", e);
    return fail("Something went wrong placing your order. You have not been charged — please try again.");
  }
}
