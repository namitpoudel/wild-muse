import { siteConfig } from "@/config/site";

/** Business details needed for structured data (from admin settings). */
export interface SeoBrand {
  name: string;
  slogan: string;
  email: string;
  social: Record<string, string>;
  standardShippingPence: number;
  returnDays: number;
}
import type { Product } from "@/lib/catalog/types";

export const absoluteUrl = (path: string) => new URL(path, siteConfig.url).toString();

export function organizationJsonLd(b: SeoBrand) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: b.name,
    url: siteConfig.url,
    logo: absoluteUrl("/icon.svg"),
    slogan: b.slogan,
    email: b.email,
    sameAs: Object.values(b.social),
  };
}

export function websiteJsonLd(b: Pick<SeoBrand, "name">) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: b.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { label: string; href?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: absoluteUrl(c.href) } : {}),
    })),
  };
}

/**
 * Product structured data. Ratings are included ONLY when real reviews exist.
 * Image URLs are added once real photography is uploaded (placeholders are SVG components).
 */
export function productJsonLd(p: Product, b: SeoBrand) {
  const url = absoluteUrl(`/products/${p.slug}`);
  const images = p.images.map((i) => i.src).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: p.name,
    description: p.description,
    url,
    productGroupID: p.id,
    ...(images.length ? { image: images } : {}),
    brand: { "@type": "Brand", name: b.name },
    material: p.fibreComposition,
    countryOfOrigin: p.countryOfOrigin,
    variesBy: ["https://schema.org/size", "https://schema.org/color"],
    hasVariant: p.variants.map((v) => ({
      "@type": "Product",
      sku: v.sku,
      name: `${p.name} — ${v.colour}, ${v.size}`,
      size: v.size,
      color: v.colour,
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "GBP",
        price: (p.pricePence / 100).toFixed(2),
        availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "GB" },
          shippingRate: { "@type": "MonetaryAmount", currency: "GBP", value: (b.standardShippingPence / 100).toFixed(2) },
        },
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "GB",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: b.returnDays,
        },
      },
    })),
    ...(p.rating.count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating.average.toFixed(1), reviewCount: p.rating.count } }
      : {}),
  };
}
