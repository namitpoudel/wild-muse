/**
 * HTTP security headers, applied to every response from next.config.ts.
 *
 * Content-Security-Policy trade-off: a nonce-based CSP forces every page to render per request
 * (no static/cached pages). WILD MUSE relies on cached catalogue pages, so this policy allows
 * inline scripts (needed for the Next.js/React inline payload) but otherwise allow-lists exact
 * origins. Third-party tracker origins are added ONLY when their ID is configured (and the
 * scripts themselves still load only after cookie consent). Stripe Checkout is a full-page
 * redirect, so no Stripe script or frame is needed on our pages.
 *
 * Kept free of Node/Next imports so it can be unit-tested and read by next.config.ts.
 */

export type CspEnv = {
  NODE_ENV?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  SUPABASE_URL?: string;
  NEXT_PUBLIC_GA4_ID?: string;
  NEXT_PUBLIC_META_PIXEL_ID?: string;
  NEXT_PUBLIC_TIKTOK_PIXEL_ID?: string;
};

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.origin : null;
  } catch {
    return null;
  }
}

export function buildCsp(env: CspEnv): string {
  const isDev = env.NODE_ENV === "development";
  const script = ["'self'", "'unsafe-inline'"];
  const connect = ["'self'"];
  const img = ["'self'", "data:", "blob:"];
  const media = ["'self'", "blob:"];

  const supabase = originOf(env.SUPABASE_URL);
  if (supabase) {
    img.push(supabase);
    media.push(supabase);
  }
  if (env.NEXT_PUBLIC_GA4_ID) {
    script.push("https://www.googletagmanager.com");
    connect.push("https://*.google-analytics.com", "https://*.analytics.google.com", "https://www.googletagmanager.com");
    img.push("https://*.google-analytics.com", "https://www.googletagmanager.com");
  }
  if (env.NEXT_PUBLIC_META_PIXEL_ID) {
    script.push("https://connect.facebook.net");
    connect.push("https://www.facebook.com");
    img.push("https://www.facebook.com");
  }
  if (env.NEXT_PUBLIC_TIKTOK_PIXEL_ID) {
    script.push("https://analytics.tiktok.com");
    connect.push("https://analytics.tiktok.com");
    img.push("https://analytics.tiktok.com");
  }
  if (isDev) {
    script.push("'unsafe-eval'"); // React dev tooling only; never in production
    connect.push("ws:"); // hot reload
  }

  const directives = [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${img.join(" ")}`,
    `media-src ${media.join(" ")}`,
    "font-src 'self'",
    `connect-src ${connect.join(" ")}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    // Checkout is a redirect to Stripe's hosted page after a server action.
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ];
  // Only for an HTTPS site: on a plain-http local server it would break same-origin redirects.
  const siteIsHttp = env.NEXT_PUBLIC_SITE_URL?.startsWith("http://");
  if (!isDev && !siteIsHttp) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

export type Header = { key: string; value: string };

export function securityHeaders(env: CspEnv): Header[] {
  const headers: Header[] = [
    { key: "Content-Security-Policy", value: buildCsp(env) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "X-DNS-Prefetch-Control", value: "on" },
  ];
  // HSTS only in production (it would pin localhost to HTTPS during development).
  if (env.NODE_ENV === "production") {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
  }
  return headers;
}

/** Private areas: never indexed, never stored by shared caches. */
export const privateHeaders: Header[] = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "Cache-Control", value: "private, no-store" },
];
export const PRIVATE_PATHS = ["/admin/:path*", "/account/:path*", "/checkout/:path*", "/api/:path*", "/invoice/:path*"];
