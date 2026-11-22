import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingHeader } from "@/components/listing/listing-header";
import { ProductListing } from "@/components/listing/product-listing";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { departments, getCategoriesFor, getDepartment } from "@/lib/catalog/categories";
import { getFacets, getProducts } from "@/lib/catalog/queries";

export function generateStaticParams() {
  return departments.map((d) => ({ department: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[department]">): Promise<Metadata> {
  const dept = getDepartment((await params).department);
  if (!dept) return {};
  return {
    title: `${dept.name}'s Bohemian Clothing`.replace("Jewellery & Accessories's Bohemian Clothing", "Handmade Jewellery & Accessories"),
    description: `${dept.tagline} Handmade in Nepal, delivered across the UK.`,
    alternates: { canonical: `/${dept.slug}` },
  };
}

export default async function DepartmentPage({ params }: PageProps<"/[department]">) {
  const dept = getDepartment((await params).department);
  if (!dept) notFound();
  const products = await getProducts({ department: dept.slug });
  const cats = getCategoriesFor(dept.slug);
  return (
    <>
      <ListingHeader
        title={dept.name}
        intro={dept.tagline}
        crumbs={[{ label: "Home", href: "/" }, { label: dept.name }]}
        chips={[{ label: "All", href: `/${dept.slug}` }, ...cats.map((c) => ({ label: c.name, href: `/${dept.slug}/${c.slug}` }))]}
        activeChip={`/${dept.slug}`}
      />
      <Suspense fallback={<div className="container-page py-12"><ProductGridSkeleton /></div>}>
        <ProductListing products={products} facets={getFacets(products)} />
      </Suspense>
    </>
  );
}
