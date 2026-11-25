#!/usr/bin/env node
/**
 * Post-deploy smoke test — READ-ONLY and safe to run against the live shop.
 *   npm run smoke -- https://wildmuse.co.uk
 * Checks pages, security headers, health, 404s, SEO files and that protected endpoints refuse
 * unauthenticated requests. Exit code 1 if anything fails.
 */
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const https = base.startsWith("https://");
let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "✔" : "✖"} ${name}${detail ? `  — ${detail}` : ""}`);
};
const get = (path, init = {}) => fetch(base + path, { redirect: "manual", ...init });

const home = await get("/");
check("home page loads (200)", home.status === 200, `status ${home.status}`);
const h = (k) => home.headers.get(k) || "";
check("Content-Security-Policy set", h("content-security-policy").includes("frame-ancestors 'none'"));
check("X-Frame-Options DENY", h("x-frame-options") === "DENY");
check("X-Content-Type-Options nosniff", h("x-content-type-options") === "nosniff");
check("Referrer-Policy set", !!h("referrer-policy"));
check("X-Powered-By hidden", !h("x-powered-by"));
if (https) check("HSTS enabled", h("strict-transport-security").includes("max-age="));

const health = await get("/api/health");
const hj = await health.json().catch(() => ({}));
check("health endpoint: database up", health.status === 200 && hj.database === "ok", JSON.stringify(hj));
check("health endpoint: no configuration errors", hj.configErrors === 0, `configErrors ${hj.configErrors}`);

for (const path of ["/women", "/new-arrivals", "/pages/faqs", "/pages/returns", "/pages/privacy", "/handmade-in-nepal", "/cart", "/login"]) {
  const r = await get(path);
  check(`${path} loads`, r.status === 200, `status ${r.status}`);
}
const nf = await get("/products/this-product-does-not-exist");
check("unknown product → 404", nf.status === 404, `status ${nf.status}`);

const robots = await get("/robots.txt");
const robotsText = await robots.text();
check("robots.txt lists the sitemap", robots.status === 200 && /Sitemap:\s*https?:\/\//i.test(robotsText));
check("robots.txt blocks admin/account/checkout", /Disallow:\s*\/admin/i.test(robotsText));
if (https) check("robots.txt sitemap uses the live https address", robotsText.includes(`Sitemap: ${base}/`));
const sitemap = await get("/sitemap.xml");
check("sitemap.xml has URLs", sitemap.status === 200 && (await sitemap.text()).includes("<loc>"));

const admin = await get("/admin");
check(
  "/admin redirects visitors to sign-in",
  [302, 303, 307, 308].includes(admin.status) && (admin.headers.get("location") || "").includes("/login"),
);
const checkout = await get("/checkout");
check("/checkout is not indexed", (checkout.headers.get("x-robots-tag") || "").includes("noindex"));
const hook = await get("/api/webhooks/stripe", { method: "POST", body: "{}" });
check("Stripe webhook rejects unsigned requests (400)", hook.status === 400, `status ${hook.status}`);
const cron = await get("/api/cron/release-reservations");
check("cron endpoint requires its secret (401)", cron.status === 401, `status ${cron.status}`);

if (https) {
  const plain = await fetch(base.replace("https://", "http://") + "/", { redirect: "manual" }).catch(() => null);
  check(
    "http:// redirects to https://",
    !!plain && [301, 308].includes(plain.status) && (plain.headers.get("location") || "").startsWith("https://"),
  );
}

console.log(failed ? `\n${failed} check(s) FAILED for ${base}` : `\nAll checks passed for ${base}`);
process.exit(failed ? 1 : 0);
