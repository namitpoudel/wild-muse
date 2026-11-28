/**
 * Production configuration check. Pure (no Node/Next imports) so it can run in the build step
 * (`scripts/check-env.ts`), the health endpoint and the admin "Launch readiness" page.
 *
 * It never returns secret VALUES — only the variable name and what's wrong with it.
 */
export type EnvIssue = { level: "error" | "warning"; key: string; message: string };
type Env = Record<string, string | undefined>;

const isHttps = (v?: string) => !!v && /^https:\/\/[^/]+$/.test(v.replace(/\/$/, ""));

export function checkProductionEnv(env: Env): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const err = (key: string, message: string) => issues.push({ level: "error", key, message });
  const warn = (key: string, message: string) => issues.push({ level: "warning", key, message });

  if (!env.DATABASE_URL) err("DATABASE_URL", "Not set.");
  else if (/localhost|127\.0\.0\.1/.test(env.DATABASE_URL)) err("DATABASE_URL", "Points at a local database.");

  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32)
    err("BETTER_AUTH_SECRET", "Must be at least 32 random characters (openssl rand -base64 32).");

  if (!isHttps(env.NEXT_PUBLIC_SITE_URL)) err("NEXT_PUBLIC_SITE_URL", "Must be the live https:// address with no path or trailing slash.");
  if (env.BETTER_AUTH_URL && env.NEXT_PUBLIC_SITE_URL && env.BETTER_AUTH_URL.replace(/\/$/, "") !== env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""))
    err("BETTER_AUTH_URL", "Must equal NEXT_PUBLIC_SITE_URL (sign-in would fail the origin check).");

  // Serverless hosts have no persistent disk, so uploads must go to Supabase Storage.
  if (env.STORAGE_DRIVER !== "supabase") err("STORAGE_DRIVER", 'Must be "supabase" in production (local files are lost on serverless hosting).');
  else {
    if (!isHttps(env.SUPABASE_URL)) err("SUPABASE_URL", "Must be your https://<project>.supabase.co address.");
    if (!env.SUPABASE_SERVICE_ROLE_KEY) err("SUPABASE_SERVICE_ROLE_KEY", "Not set.");
  }

  if (env.EMAIL_DRIVER !== "resend") err("EMAIL_DRIVER", 'Must be "resend" in production, otherwise customers receive no emails.');
  else if (!env.RESEND_API_KEY) err("RESEND_API_KEY", "Not set.");
  if (!env.EMAIL_FROM || /example|yourdomain/i.test(env.EMAIL_FROM))
    err("EMAIL_FROM", "Set a sender on your verified domain, e.g. Wild Muse <hello@wildmuse.co.uk>.");
  else if (/@resend\.dev>?$/i.test(env.EMAIL_FROM))
    warn("EMAIL_FROM", "Using Resend's test sender: emails reach only your own Resend account address. Verify your domain in Resend before launch.");

  if (!env.STRIPE_SECRET_KEY) err("STRIPE_SECRET_KEY", "Not set — checkout will refuse orders.");
  else if (env.STRIPE_SECRET_KEY.startsWith("sk_test_"))
    warn(
      "STRIPE_SECRET_KEY",
      "Test-mode key: customers cannot pay real money. Switch to the live key (sk_live_ or a restricted rk_live_ key) at launch.",
    );
  else if (!/^(sk|rk)_live_/.test(env.STRIPE_SECRET_KEY)) err("STRIPE_SECRET_KEY", "Doesn't look like a Stripe secret key.");
  if (env.STRIPE_WEBHOOK_SECRET && !env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_"))
    err("STRIPE_WEBHOOK_SECRET", "Doesn't look like a Stripe signing secret (whsec_…).");
  else if (!env.STRIPE_WEBHOOK_SECRET)
    warn("STRIPE_WEBHOOK_SECRET", "Not set here — use Admin → Launch readiness → “Connect Stripe webhook” (one click) after the first deploy.");

  if (!env.CRON_SECRET || env.CRON_SECRET.length < 16)
    err("CRON_SECRET", "Set at least 16 random characters; abandoned checkouts won't release stock without it.");

  if (env.AUTH_RATE_LIMIT === "off" || env.APP_RATE_LIMIT === "off")
    err("AUTH_RATE_LIMIT", "Rate limiting is switched off — remove AUTH_RATE_LIMIT / APP_RATE_LIMIT.");
  if (env.AUTH_CHECK_BREACHED_PASSWORDS !== "true")
    warn("AUTH_CHECK_BREACHED_PASSWORDS", 'Recommended: "true" (rejects passwords found in known data breaches).');
  if (!env.ROYALMAIL_CLICKDROP_API_KEY)
    warn("ROYALMAIL_CLICKDROP_API_KEY", "Not set — dispatch with tracking numbers entered by hand (fine to start with).");

  return issues;
}

/** True when running as the live site (Vercel production, or an explicit override for other hosts). */
export function isLiveDeployment(env: Env): boolean {
  return env.VERCEL_ENV === "production" || env.WILDMUSE_ENV === "production";
}
