import "server-only";
import { siteConfig } from "@/config/site";
import { db } from "../db";
import { getStripe } from "./stripe";

/**
 * One-click Stripe webhook setup from Admin → Launch readiness, so the owner doesn't have to create
 * the endpoint in the Stripe Dashboard and copy its signing secret. The secret is stored server-side
 * in SiteSetting (never sent to the browser). An explicit STRIPE_WEBHOOK_SECRET env var always wins.
 */
export const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "refund.created",
  "refund.updated",
  "refund.failed",
  "charge.dispute.created",
] as const;

const KEY = "stripeWebhook";
type Stored = { endpointId: string; secret: string; url: string; livemode: boolean; createdAt: string };

async function getStored(): Promise<Stored | null> {
  const row = await db.siteSetting.findUnique({ where: { key: KEY } });
  return (row?.value as Stored | undefined) ?? null;
}

/** The signing secret to verify incoming webhooks with (env var first, then the one-click setup). */
export async function getWebhookSecret(): Promise<string | null> {
  if (process.env.STRIPE_WEBHOOK_SECRET) return process.env.STRIPE_WEBHOOK_SECRET;
  return (await getStored())?.secret ?? null;
}

export async function getWebhookStatus(): Promise<{ source: "env" | "auto" | "none"; url?: string; livemode?: boolean }> {
  if (process.env.STRIPE_WEBHOOK_SECRET) return { source: "env" };
  const s = await getStored();
  return s ? { source: "auto", url: s.url, livemode: s.livemode } : { source: "none" };
}

export function webhookUrl(base = siteConfig.url): string {
  return new URL("/api/webhooks/stripe", base).toString();
}

/** Create (or re-create) the endpoint for this site and store its signing secret. */
export async function connectStripeWebhook(): Promise<{ url: string; livemode: boolean; replaced: boolean }> {
  const url = webhookUrl();
  if (!url.startsWith("https://")) throw new Error("The site address must be https:// for Stripe to deliver webhooks.");
  const stripe = getStripe();

  // A signing secret is only revealed when an endpoint is created, so replace any endpoint for this URL.
  let replaced = false;
  for await (const ep of stripe.webhookEndpoints.list({ limit: 100 })) {
    if (ep.url === url) {
      await stripe.webhookEndpoints.del(ep.id);
      replaced = true;
    }
  }
  const ep = await stripe.webhookEndpoints.create({
    url,
    enabled_events: [...WEBHOOK_EVENTS],
    description: "WILD MUSE shop — created from Admin → Launch readiness",
  });
  if (!ep.secret) throw new Error("Stripe did not return a signing secret.");
  const value: Stored = { endpointId: ep.id, secret: ep.secret, url, livemode: ep.livemode, createdAt: new Date().toISOString() };
  await db.siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
  return { url, livemode: ep.livemode, replaced };
}
