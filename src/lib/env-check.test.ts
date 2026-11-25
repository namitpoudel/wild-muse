import { describe, expect, it } from "vitest";
import { checkProductionEnv, isLiveDeployment } from "./env-check";

const good = {
  DATABASE_URL: "postgresql://postgres.abc:pw@aws-0-eu-west-2.pooler.supabase.com:6543/postgres",
  BETTER_AUTH_SECRET: "x".repeat(44),
  NEXT_PUBLIC_SITE_URL: "https://wildmuse.co.uk",
  BETTER_AUTH_URL: "https://wildmuse.co.uk",
  STORAGE_DRIVER: "supabase",
  SUPABASE_URL: "https://abc.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  EMAIL_DRIVER: "resend",
  RESEND_API_KEY: "re_x",
  EMAIL_FROM: "Wild Muse <hello@wildmuse.co.uk>",
  STRIPE_SECRET_KEY: "sk_live_x",
  STRIPE_WEBHOOK_SECRET: "whsec_x",
  CRON_SECRET: "y".repeat(32),
  AUTH_CHECK_BREACHED_PASSWORDS: "true",
  ROYALMAIL_CLICKDROP_API_KEY: "k",
};

describe("production env check", () => {
  it("passes a complete live configuration", () => {
    expect(checkProductionEnv(good)).toEqual([]);
  });

  it("flags the development defaults as errors", () => {
    const keys = checkProductionEnv({
      DATABASE_URL: "postgresql://wildmuse:wildmuse_dev@localhost:5432/wildmuse",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      STORAGE_DRIVER: "local",
      EMAIL_DRIVER: "console",
      EMAIL_FROM: "Wild Muse <hello@yourdomain.co.uk>",
    })
      .filter((i) => i.level === "error")
      .map((i) => i.key);
    for (const k of [
      "DATABASE_URL",
      "BETTER_AUTH_SECRET",
      "NEXT_PUBLIC_SITE_URL",
      "STORAGE_DRIVER",
      "EMAIL_DRIVER",
      "EMAIL_FROM",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "CRON_SECRET",
    ])
      expect(keys).toContain(k);
  });

  it("warns (not errors) on a Stripe test key, and errors on a mismatched auth URL", () => {
    const issues = checkProductionEnv({ ...good, STRIPE_SECRET_KEY: "sk_test_x", BETTER_AUTH_URL: "https://other.example" });
    expect(issues.find((i) => i.key === "STRIPE_SECRET_KEY")?.level).toBe("warning");
    expect(issues.find((i) => i.key === "BETTER_AUTH_URL")?.level).toBe("error");
  });

  it("never echoes secret values", () => {
    const text = JSON.stringify(checkProductionEnv({ ...good, STRIPE_SECRET_KEY: "sk_test_SECRETVALUE", CRON_SECRET: "short" }));
    expect(text).not.toContain("SECRETVALUE");
    expect(text).not.toContain("short");
  });

  it("detects the live deployment", () => {
    expect(isLiveDeployment({ VERCEL_ENV: "production" })).toBe(true);
    expect(isLiveDeployment({ VERCEL_ENV: "preview" })).toBe(false);
  });
});
