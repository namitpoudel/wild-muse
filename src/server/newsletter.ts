import "server-only";
import { randomBytes } from "node:crypto";
import { siteConfig } from "@/config/site";
import { db } from "./db";
import { sendEmail } from "./email";
import { layout } from "./email/templates";
import { getSettings } from "./settings";

/**
 * Newsletter with double opt-in (PECR/UK GDPR): a subscriber is only SUBSCRIBED after
 * clicking the confirmation link. The exact consent wording and source are stored as
 * evidence. The optional first-order discount is issued only after confirmation.
 */
export const CONSENT_TEXT = "Yes, I'd like to receive emails from Wild Muse about new products, offers and stories. I can unsubscribe at any time.";
const token = () => randomBytes(24).toString("base64url");
const url = (path: string) => new URL(path, siteConfig.url).toString();

export async function requestSubscription(email: string, source: string, userId?: string | null) {
  const existing = await db.newsletterSubscriber.findUnique({ where: { email } });
  if (existing?.status === "SUBSCRIBED") return { already: true };
  const confirmToken = token();
  const sub = existing
    ? await db.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          confirmToken,
          consentText: CONSENT_TEXT,
          consentSource: source,
          consentAt: new Date(),
          userId: existing.userId ?? userId ?? null,
        },
      })
    : await db.newsletterSubscriber.create({
        data: {
          email,
          status: "PENDING",
          confirmToken,
          unsubscribeToken: token(),
          consentText: CONSENT_TEXT,
          consentSource: source,
          userId: userId ?? null,
        },
      });
  const { html, text } = await layout({
    title: "Please confirm your subscription",
    intro: "Thanks for joining the wild side! Confirm your email address to start receiving our newsletter.",
    cta: { label: "Confirm subscription", url: url(`/api/newsletter/confirm?token=${sub.confirmToken}`) },
    footerNote: "If you didn't sign up, ignore this email and you won't be subscribed.",
  });
  await sendEmail({ to: email, subject: "Confirm your Wild Muse newsletter subscription", html, text, tags: { type: "newsletter-confirm" } });
  return { already: false };
}

export async function confirmSubscription(confirmToken: string) {
  const sub = await db.newsletterSubscriber.findUnique({ where: { confirmToken } });
  if (!sub) return null;
  const settings = await getSettings();
  let code = sub.welcomeCouponCode;
  const pct = settings.commerce.newsletterDiscountPercent;
  if (!code && pct > 0) {
    code = `WELCOME-${randomBytes(3).toString("hex").toUpperCase()}`;
    await db.coupon.create({
      data: {
        code,
        description: `Newsletter welcome ${pct}% for ${sub.email}`,
        type: "PERCENT",
        value: pct,
        usageLimit: 1,
        perCustomerLimit: 1,
        firstOrderOnly: true,
        endsAt: new Date(Date.now() + 60 * 86400_000),
      },
    });
  }
  await db.newsletterSubscriber.update({
    where: { id: sub.id },
    data: { status: "SUBSCRIBED", confirmToken: null, confirmedAt: new Date(), unsubscribedAt: null, welcomeCouponCode: code },
  });
  if (code && !sub.welcomeCouponCode) {
    const { html, text } = await layout({
      title: "Welcome to the wild side",
      intro: `You're subscribed! Here's ${pct}% off your first order:`,
      paragraphs: [`Your code: ${code}`, "Valid for 60 days on your first order. One use per customer."],
      cta: { label: "Start shopping", url: url("/new-arrivals") },
      footerNote: `Unsubscribe any time: ${url(`/api/newsletter/unsubscribe?token=${sub.unsubscribeToken}`)}`,
    });
    await sendEmail({ to: sub.email, subject: `Your ${pct}% welcome code`, html, text, tags: { type: "newsletter-welcome" } });
  }
  return { code };
}

export async function unsubscribe(unsubscribeToken: string) {
  const res = await db.newsletterSubscriber.updateMany({
    where: { unsubscribeToken },
    data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date(), confirmToken: null },
  });
  return res.count > 0;
}
