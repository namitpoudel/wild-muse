import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingHeader } from "@/components/listing/listing-header";
import { ProductListing } from "@/components/listing/product-listing";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { getFacets } from "@/lib/catalog/product-utils";
import type { Department } from "@/lib/catalog/types";
import { getCategoriesFor, getCategory, getDepartment } from "@/server/catalog/categories";
import { getCategories, getProducts } from "@/server/catalog/queries";

export async function generateStaticParams() {
  const cats = await getCategories().catch(() => []);
  // Cache Components requires at least one param; unknown paths still render on demand.
  return cats.length ? cats.map((c) => ({ department: c.department, category: c.slug })) : [{ department: "women", category: "dresses" }];
}

async function resolve(department: string, category: string) {
  const dept = getDepartment(department);
  const cat = dept ? await getCategory(dept.slug as Department, category) : undefined;
  return dept && cat ? { dept, cat } : null;
}

export async function generateMetadata({ params }: PageProps<"/[department]/[category]">): Promise<Metadata> {
  const { department, category } = await params;
  const r = await resolve(department, category);
  if (!r) return {};
  return {
    title: `${r.cat.name} — ${r.dept.name}`,
    description: `Shop handmade ${r.cat.name.toLowerCase()} from Nepal at Wild Muse. Tracked UK delivery.`,
    alternates: { canonical: `/${r.dept.slug}/${r.cat.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps<"/[department]/[category]">) {
  const { department, category } = await params;
  const r = await resolve(department, category);
  if (!r) notFound();
  const { dept, cat } = r;
  const [products, all, cats] = await Promise.all([
    getProducts({ department: dept.slug, category: cat.slug }),
    getProducts({ department: dept.slug }),
    getCategoriesFor(dept.slug),
  ]);
  return (
    <>
      <ListingHeader
        title={cat.name}
        intro={cat.description}
        crumbs={[{ label: "Home", href: "/" }, { label: dept.name, href: `/${dept.slug}` }, { label: cat.name }]}
        chips={[{ label: "All", href: `/${dept.slug}` }, ...cats.map((c) => ({ label: c.name, href: `/${dept.slug}/${c.slug}` }))]}
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
