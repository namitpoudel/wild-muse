import type { NextConfig } from "next";
import { PRIVATE_PATHS, privateHeaders, securityHeaders } from "./src/config/security-headers";
import { applyEnvFallbacks } from "./src/lib/env-fallbacks";

// Fill settings from Vercel/integrations (e.g. the site address) before they are inlined into the build.
applyEnvFallbacks(process.env);

const nextConfig: NextConfig = {
  // Cache Components: pages are prerendered and cached; data uses `use cache` + tags.
  cacheComponents: true,
  // Partial Prefetching is intentionally OFF: dynamic routes await `params` at the top level
  // ("blocking" ISR), so unknown URLs return a real 404 and edited pages regenerate cleanly.
  partialPrefetching: false,
  poweredByHeader: false,
  ...(process.env.NEXT_PUBLIC_SITE_URL ? { env: { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL } } : {}),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders(process.env) }, ...PRIVATE_PATHS.map((source) => ({ source, headers: privateHeaders }))];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
