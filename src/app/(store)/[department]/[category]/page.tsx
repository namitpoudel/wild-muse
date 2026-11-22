import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingHeader } from "@/components/listing/listing-header";
import { ProductListing } from "@/components/listing/product-listing";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { categories, getCategoriesFor, getCategory, getDepartment } from "@/lib/catalog/categories";
import { getFacets, getProducts } from "@/lib/catalog/queries";
import type { Department } from "@/lib/catalog/types";

export function generateStaticParams() {
  return categories.map((c) => ({ department: c.department, category: c.slug }));
}

function resolve(department: string, category: string) {
  const dept = getDepartment(department);
  const cat = dept ? getCategory(dept.slug as Department, category) : undefined;
  return dept && cat ? { dept, cat } : null;
}

export async function generateMetadata({ params }: PageProps<"/[department]/[category]">): Promise<Metadata> {
  const { department, category } = await params;
  const r = resolve(department, category);
  if (!r) return {};
  return {
    title: `${r.cat.name} — ${r.dept.name}`,
    description: `Shop handmade ${r.cat.name.toLowerCase()} from Nepal at Wild Muse. Free UK delivery over £75.`,
    alternates: { canonical: `/${r.dept.slug}/${r.cat.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps<"/[department]/[category]">) {
  const { department, category } = await params;
  const r = resolve(department, category);
  if (!r) notFound();
  const { dept, cat } = r;
  const products = await getProducts({ department: dept.slug, category: cat.slug });
  const all = await getProducts({ department: dept.slug });
  return (
    <>
      <ListingHeader
        title={cat.name}
        crumbs={[{ label: "Home", href: "/" }, { label: dept.name, href: `/${dept.slug}` }, { label: cat.name }]}
        chips={[
          { label: "All", href: `/${dept.slug}` },
          ...getCategoriesFor(dept.slug).map((c) => ({ label: c.name, href: `/${dept.slug}/${c.slug}` })),
        ]}
        activeChip={`/${dept.slug}/${cat.slug}`}
      />
      <Suspense
        fallback={
          <div className="container-page py-12">
            <ProductGridSkeleton />
          </div>
        }
      >
        <ProductListing products={products} facets={getFacets(products.length ? products : all)} />
      </Suspense>
    </>
  );
}
