import { CategoryTiles } from "@/components/home/category-tiles";
import { CollectionGrid } from "@/components/home/collection-grid";
import { HandmadeStory } from "@/components/home/handmade-story";
import { Hero } from "@/components/home/hero";
import { Newsletter } from "@/components/home/newsletter";
import { ProductRail } from "@/components/home/product-rail";
import { ReviewsSection } from "@/components/home/reviews-section";
import { SocialGallery } from "@/components/home/social-gallery";
import { ValueStrip } from "@/components/home/value-strip";
import { JsonLd } from "@/components/seo/json-ld";
import { getBestSellers, getCollections, getNewArrivals } from "@/server/catalog/queries";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { getSeoBrand } from "@/server/seo-brand";
import { getLatestApprovedReviews } from "@/server/reviews";
import { getSettings } from "@/server/settings";

export const metadata = { alternates: { canonical: "/" } };

/**
 * Homepage. In Stage 4 the order, visibility and content of every section
 * comes from the HomepageSection table (admin → Content → Homepage).
 */
export default async function HomePage() {
  const [bestSellers, newArrivals, collections, brand, settings] = await Promise.all([
    getBestSellers(8),
    getNewArrivals(8),
    getCollections(),
    getSeoBrand(),
    getSettings(),
  ]);
  const latestReviews = await getLatestApprovedReviews(3);
  const hero = settings.hero;
  return (
    <>
      <JsonLd data={organizationJsonLd(brand)} />
      <JsonLd data={websiteJsonLd(brand)} />
      <Hero
        content={{
          eyebrow: hero.eyebrow,
          heading: hero.heading,
          subheading: hero.subheading,
          ctas: hero.ctas,
          primaryImage: hero.primaryImageUrl
            ? { src: hero.primaryImageUrl, alt: "Wild Muse hero image", kind: "landscape", tone: "terracotta" }
            : undefined,
          secondaryImage: hero.secondaryImageUrl
            ? { src: hero.secondaryImageUrl, alt: "Wild Muse model wearing handmade clothing", kind: "dress", tone: "sand" }
            : undefined,
        }}
      />
      <ValueStrip />
      <CollectionGrid collections={collections.filter((c) => c.featured).slice(0, 7)} />
      <ProductRail
        id="bestsellers-heading"
        eyebrow="Best sellers"
        title="Most-loved pieces"
        href="/best-sellers"
        products={bestSellers}
        tone="cream"
      />
      <ProductRail id="new-heading" eyebrow="Just landed" title="New arrivals" href="/new-arrivals" products={newArrivals} />
      <HandmadeStory />
      <CategoryTiles />
      <ReviewsSection reviews={latestReviews} />
      <SocialGallery />
      <Newsletter />
    </>
  );
}
