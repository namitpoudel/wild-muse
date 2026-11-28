import "server-only";
import { checkProductionEnv, isLiveDeployment } from "@/lib/env-check";
import { db } from "@/server/db";
import { getWebhookStatus } from "@/server/payments/webhook-setup";
import { DEFAULT_SETTINGS, getSettings } from "@/server/settings";

export type ReadinessStatus = "done" | "todo" | "warning";
export type ReadinessItem = {
  id: string;
  group: string;
  label: string;
  status: ReadinessStatus;
  detail?: string;
  href?: string;
  action?: "connect-stripe-webhook";
};

/**
 * Text in [square brackets] that isn't a Markdown link, e.g. "[legal business name]".
 * Page bodies are stored as JSON blocks, so we search the serialised text.
 */
const PLACEHOLDER = /\[(?:[A-Za-z][^\]\n]{2,60})\](?!\()/g;
export function findPlaceholders(text: string): string[] {
  return [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[0]))];
}

/** Everything the owner must finish before taking real orders. Read-only; never exposes secret values. */
export async function getLaunchReadiness(): Promise<{ items: ReadinessItem[]; live: boolean }> {
  const live = isLiveDeployment(process.env);
  const items: ReadinessItem[] = [];
  const add = (i: ReadinessItem) => items.push(i);

  // ── Hosting configuration ──
  const env = checkProductionEnv(process.env);
  if (!env.length) add({ id: "env", group: "Hosting & integrations", label: "Production configuration complete", status: "done" });
  for (const i of env)
    add({
      id: `env-${i.key}`,
      group: "Hosting & integrations",
      label: `${i.key}`,
      status: i.level === "error" ? "todo" : "warning",
      detail: i.message + (live ? "" : " (Checked again on the live site — development values are expected here.)"),
    });

  const hook = await getWebhookStatus();
  add({
    id: "webhook-setup",
    group: "Hosting & integrations",
    label: "Stripe webhook connected (confirms payments)",
    status: hook.source === "none" ? "todo" : "done",
    detail:
      hook.source === "auto"
        ? `Connected to ${hook.url} (${hook.livemode ? "live" : "test"} mode). Connect again after changing domain or switching Stripe mode.`
        : hook.source === "env"
          ? "Using STRIPE_WEBHOOK_SECRET from the hosting settings."
          : "Not connected yet — no order can be marked paid until it is. Use the button below.",
    action: hook.source === "env" ? undefined : "connect-stripe-webhook",
  });
  const lastWebhook = await db.processedWebhookEvent.findFirst({ where: { provider: "stripe" }, orderBy: { createdAt: "desc" } });
  add({
    id: "webhook",
    group: "Hosting & integrations",
    label: "Stripe webhook is delivering events",
    status: lastWebhook ? "done" : "todo",
    detail: lastWebhook
      ? `Last event received ${lastWebhook.createdAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}.`
      : "No Stripe event received yet. Make a test purchase after connecting the webhook.",
  });

  // ── Business details ──
  const s = await getSettings();
  const b = s.business;
  const d = DEFAULT_SETTINGS.business;
  const missing = [
    (!b.legalName || b.legalName === d.legalName || b.legalName.includes("[")) && "legal business name",
    (!b.email || /example\./.test(b.email)) && "customer service email",
    (!b.phone || /0000/.test(b.phone)) && "phone number",
    (!b.address || /to be confirmed/i.test(b.address)) && "registered/trading address",
  ].filter(Boolean) as string[];
  add({
    id: "business",
    group: "Business & legal",
    label: "Business details (shown in the footer, emails, invoices and policies)",
    status: missing.length ? "todo" : "done",
    detail: missing.length ? `Still placeholder: ${missing.join(", ")}.` : undefined,
    href: "/admin/settings",
  });
  add({
    id: "vat",
    group: "Business & legal",
    label: s.tax.vatRegistered ? "VAT registered — VAT shown on invoices" : "Not VAT registered",
    status: s.tax.vatRegistered && !b.vatNumber ? "todo" : "done",
    detail: s.tax.vatRegistered
      ? b.vatNumber
        ? undefined
        : "Add your VAT number in Store settings."
      : "Correct if your VAT-taxable turnover is under the registration threshold. Check gov.uk for the current threshold and switch VAT on in Store settings once registered.",
    href: "/admin/settings",
  });

  const pages = await db.contentPage.findMany({
    select: { path: true, title: true, blocks: true, summary: true, description: true, requiresLegalReview: true },
  });
  const withPlaceholders = pages
    .map((p) => ({ p, found: findPlaceholders(JSON.stringify([p.blocks, p.summary, p.description])) }))
    .filter((x) => x.found.length);
  add({
    id: "placeholders",
    group: "Business & legal",
    label: "Policy and information pages have no [placeholder] text",
    status: withPlaceholders.length ? "todo" : "done",
    detail: withPlaceholders.length
      ? withPlaceholders.map((x) => `${x.p.title}: ${x.found.slice(0, 3).join(", ")}${x.found.length > 3 ? "…" : ""}`).join(" · ")
      : undefined,
    href: "/admin/content",
  });
  const legal = pages.filter((p) => p.requiresLegalReview);
  add({
    id: "legal-review",
    group: "Business & legal",
    label: "Terms, privacy, returns and cookie policies reviewed by a qualified adviser",
    status: legal.length ? "todo" : "done",
    detail: legal.length ? `Marked as awaiting legal review: ${legal.map((p) => p.title).join(", ")}. Untick the notice once reviewed.` : undefined,
    href: "/admin/content",
  });

  // ── Catalogue ──
  const [demo, real, realNoImage, shipping] = await Promise.all([
    db.product.count({ where: { isDemo: true } }),
    db.product.count({ where: { isDemo: false, status: "PUBLISHED" } }),
    db.product.count({ where: { isDemo: false, status: "PUBLISHED", images: { none: {} } } }),
    db.shippingMethod.count({ where: { isActive: true } }),
  ]);
  add({
    id: "demo",
    group: "Catalogue",
    label: "Demo products removed",
    status: demo ? "todo" : "done",
    detail: demo ? `${demo} demo product(s) still in the catalogue. Use "Remove all demo products" on the Products page.` : undefined,
    href: "/admin/products",
  });
  add({
    id: "products",
    group: "Catalogue",
    label: "Real products published",
    status: real ? (realNoImage ? "warning" : "done") : "todo",
    detail: real ? (realNoImage ? `${real} published; ${realNoImage} without photos.` : `${real} published.`) : "No real products published yet.",
    href: "/admin/products",
  });
  add({
    id: "shipping",
    group: "Catalogue",
    label: "Delivery methods and prices confirmed",
    status: shipping ? "warning" : "todo",
    detail: shipping
      ? `${shipping} active. Check prices against your Royal Mail / courier rates.`
      : "No active delivery method — checkout can't complete.",
    href: "/admin/settings",
  });

  // ── Storefront ──
  add({
    id: "hero",
    group: "Storefront",
    label: "Homepage photography uploaded",
    status: s.hero.primaryImageUrl ? "done" : "warning",
    detail: s.hero.primaryImageUrl ? undefined : "The homepage still shows placeholder artwork.",
    href: "/admin/content/homepage",
  });
  const genericSocial = Object.values(s.social).filter((u) => /^https:\/\/www\.(instagram|tiktok|facebook)\.com\/?$/.test(u)).length;
  add({
    id: "social",
    group: "Storefront",
    label: "Social media links point to your accounts",
    status: genericSocial ? "warning" : "done",
    detail: genericSocial ? `${genericSocial} link(s) still go to the generic site homepage.` : undefined,
    href: "/admin/settings",
  });

  return { items, live };
}
