import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquareHeart } from "lucide-react";
import { ProductRail } from "@/components/home/product-rail";
import { BuyBox } from "@/components/product/buy-box";
import { ProductGallery } from "@/components/product/product-gallery";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { ReviewCard } from "@/components/product/review-card";
import { WriteReview } from "@/components/product/review-form";
import { getApprovedReviews } from "@/server/reviews";
import { Suspense } from "react";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { Price } from "@/components/ui/price";
import { StarRating } from "@/components/ui/star-rating";
import { JsonLd } from "@/components/seo/json-ld";
import { getCategory, getDepartment } from "@/server/catalog/categories";
import { productJsonLd } from "@/lib/seo";
import { getSeoBrand } from "@/server/seo-brand";
import { getAllProductSlugs, getProductBySlug, getProducts, getRelatedProducts } from "@/server/catalog/queries";
import { isNewArrival } from "@/lib/catalog/product-utils";

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs().catch(() => []);
  // Cache Components requires at least one param. A new shop has no products yet, so use a
  // placeholder that renders the 404 page; real products are rendered on demand and cached.
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description: product.shortDescription, type: "website" },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const dept = getDepartment(product.department)!;
  const cat = await getCategory(product.department, product.categorySlug);
  const [related, all, reviews] = await Promise.all([getRelatedProducts(product, 4), getProducts(), getApprovedReviews(product.id)]);

  const details = [
    { id: "description", title: "Description", content: <p>{product.description}</p> },
    {
      id: "materials",
      title: "Materials & care",
      content: (
        <div className="space-y-3">
          <p>
            <strong className="text-chocolate">Fibre composition:</strong> {product.fibreComposition}
          </p>
          <p>
            <strong className="text-chocolate">Materials:</strong> {product.materials}
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {product.care.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: "origin",
      title: product.isHandmade ? "Handmade in Nepal" : "Origin",
      content: (
        <div className="space-y-3">
          <p>
            <strong className="text-chocolate">Country of origin:</strong> {product.countryOfOrigin}
          </p>
          {product.isHandmade && (
            <p>
              {product.craftStory ??
                "Made by hand by artisans in Nepal, so small variations in colour, weave and finish are part of each piece's character."}
            </p>
          )}
          <Link href="/handmade-in-nepal/meet-the-artisans" className="font-semibold text-terracotta underline underline-offset-4">
            Meet the makers
          </Link>
        </div>
      ),
    },
    {
      id: "delivery",
      title: "Delivery & returns",
      content: (
        <div className="space-y-3">
          <p>UK standard delivery (2–4 working days) £3.95, free on orders over £75. UK express (next working day if ordered by 1pm) £6.95.</p>
          <p>
            Changed your mind? Return unworn items within 30 days for a full refund. Under UK law you can cancel any online order within 14 days of
            receiving it.{" "}
            <Link href="/pages/returns" className="font-semibold text-terracotta underline underline-offset-4">
              Returns policy
            </Link>
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      <JsonLd data={productJsonLd(product, await getSeoBrand())} />
      <div className="container-page pt-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: dept.name, href: `/${dept.slug}` },
            ...(cat ? [{ label: cat.name, href: `/${dept.slug}/${cat.slug}` }] : []),
            { label: product.name },
          ]}
        />
      </div>
      <div className="container-page grid gap-8 py-6 lg:grid-cols-12 lg:gap-12 lg:py-10">
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} name={product.name} />
        </div>
        <div className="lg:col-span-5">
          <div className="flex flex-wrap gap-1.5">
            {product.isHandmade && <Badge tone="handmade">Handmade in Nepal</Badge>}
            {isNewArrival(product) && <Badge tone="new">New</Badge>}
          </div>
          <h1 className="mt-3 font-display text-display-md font-normal">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Price pricePence={product.pricePence} compareAtPence={product.compareAtPricePence} size="lg" />
            <StarRating average={product.rating.average} count={product.rating.count} />
          </div>
          <p className="mt-1 text-xs text-bark">Price includes VAT where applicable.</p>
          <p className="mt-5 leading-relaxed text-bark">{product.shortDescription}</p>
          <div className="mt-7">
            <BuyBox product={product} />
          </div>
          <Accordion items={details} defaultOpen={["description"]} className="mt-8" headingLevel={2} />
        </div>
      </div>

      <section className="border-t border-sand bg-cream" aria-labelledby="reviews-heading">
        <div className="container-page grid gap-8 py-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="reviews-heading" className="font-display text-display-md">
              Reviews
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <StarRating average={product.rating.average} count={product.rating.count} />
              <p className="text-sm text-bark">
                {product.rating.count
                  ? `${product.rating.average.toFixed(1)} out of 5 from ${product.rating.count} review${product.rating.count === 1 ? "" : "s"}`
                  : "No reviews yet."}
              </p>
            </div>
            <Suspense fallback={<div className="mt-5 h-11" />}>
              <WriteReview productId={product.id} productName={product.name} slug={product.slug} />
            </Suspense>
            <p className="mt-3 text-xs text-bark">
              Only customers with an account can review. Purchases are marked &ldquo;Verified&rdquo; automatically from our order records.{" "}
              <Link href="/pages/review-policy" className="underline">
                Review policy
              </Link>
            </p>
          </div>
          <div className="lg:col-span-8">
            {reviews.length ? (
              <ul className="grid gap-4 md:grid-cols-2">
                {reviews.map((r) => (
                  <li key={r.id}>
                    <ReviewCard review={r} reportable />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState headingLevel={3} icon={MessageSquareHeart} title="Be the first to review" className="rounded-[2px] bg-linen">
                Bought this piece? Share how it fits and feels to help other free spirits choose.
              </EmptyState>
            )}
          </div>
        </div>
      </section>

      <ProductRail id="related-heading" eyebrow="You may also love" title="Complete the look" href={`/${dept.slug}`} products={related} />
      <RecentlyViewed current={product.slug} candidates={all} />
    </>
  );
}
