import { siteConfig } from "@/config/site";
import type { Product } from "@/lib/catalog/types";

export const absoluteUrl = (path: string) => new URL(path, siteConfig.url).toString();

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/icon.svg"),
    slogan: siteConfig.slogan,
    email: siteConfig.contact.email,
    sameAs: Object.values(siteConfig.social),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
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
export function productJsonLd(p: Product) {
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
    brand: { "@type": "Brand", name: siteConfig.name },
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
          shippingRate: { "@type": "MonetaryAmount", currency: "GBP", value: (siteConfig.commerce.standardDeliveryPence / 100).toFixed(2) },
        },
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "GB",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: siteConfig.commerce.returnDays,
        },
      },
    })),
    ...(p.rating.count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating.average.toFixed(1), reviewCount: p.rating.count } }
      : {}),
  };
}
