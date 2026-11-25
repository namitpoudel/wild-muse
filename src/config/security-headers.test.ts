import { describe, expect, it } from "vitest";
import { buildCsp, securityHeaders } from "./security-headers";

describe("security headers", () => {
  it("production CSP is locked down and has no eval or tracker origins by default", () => {
    const csp = buildCsp({ NODE_ENV: "production" });
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toContain("googletagmanager");
    expect(csp).not.toContain("facebook");
  });

  it("adds tracker and storage origins only when configured", () => {
    const csp = buildCsp({
      NODE_ENV: "production",
      SUPABASE_URL: "https://abc.supabase.co",
      NEXT_PUBLIC_GA4_ID: "G-TEST",
    });
    expect(csp).toMatch(/img-src [^;]*https:\/\/abc\.supabase\.co/);
    expect(csp).toMatch(/script-src [^;]*https:\/\/www\.googletagmanager\.com/);
    expect(csp).not.toContain("connect.facebook.net");
  });

  it("omits upgrade-insecure-requests for a plain-http local site", () => {
    expect(buildCsp({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" })).not.toContain("upgrade-insecure-requests");
    expect(buildCsp({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://wildmuse.co.uk" })).toContain("upgrade-insecure-requests");
  });

  it("ignores a non-https storage URL", () => {
    expect(buildCsp({ NODE_ENV: "production", SUPABASE_URL: "http://evil.test" })).not.toContain("evil.test");
  });

  it("sends HSTS only in production", () => {
    const keys = (env: string) => securityHeaders({ NODE_ENV: env }).map((h) => h.key);
    expect(keys("production")).toContain("Strict-Transport-Security");
    expect(keys("development")).not.toContain("Strict-Transport-Security");
  });
});
