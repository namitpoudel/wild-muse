import type { NextConfig } from "next";
import { PRIVATE_PATHS, privateHeaders, securityHeaders } from "./src/config/security-headers";

const nextConfig: NextConfig = {
  // Cache Components: pages are prerendered and cached; data uses `use cache` + tags.
  cacheComponents: true,
  // Partial Prefetching is intentionally OFF: dynamic routes await `params` at the top level
  // ("blocking" ISR), so unknown URLs return a real 404 and edited pages regenerate cleanly.
  partialPrefetching: false,
  poweredByHeader: false,
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
