import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/checkout", "/cart", "/api/", "/search", "/wishlist", "/design-system"] },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
