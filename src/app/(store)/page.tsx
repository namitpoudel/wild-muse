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
import { getBestSellers, getCollections, getNewArrivals } from "@/lib/catalog/queries";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

export const metadata = { alternates: { canonical: "/" } };

/**
 * Homepage. In Stage 4 the order, visibility and content of every section
 * comes from the HomepageSection table (admin → Content → Homepage).
 */
export default async function HomePage() {
  const [bestSellers, newArrivals, collections] = await Promise.all([getBestSellers(8), getNewArrivals(8), getCollections()]);
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <Hero
        content={{
          eyebrow: "Find your wild. Wear your soul.",
          heading: "Wear your wild side.",
          subheading: "Discover handcrafted bohemian fashion, inspired by Nepal and made for free spirits.",
          ctas: [
            { label: "Shop Women", href: "/women" },
            { label: "Shop Men", href: "/men" },
            { label: "Explore Handmade", href: "/handmade-in-nepal" },
          ],
        }}
      />
      <ValueStrip />
      <CollectionGrid collections={collections} />
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
      <ReviewsSection reviews={[]} />
      <SocialGallery />
      <Newsletter />
    </>
  );
}
