import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SimpleListingPage } from "@/components/listing/simple-listing-page";
import { getCollection, getCollections, getProducts } from "@/lib/catalog/queries";

export async function generateStaticParams() {
  return (await getCollections()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const c = await getCollection((await params).slug);
  if (!c) return {};
  return {
    title: c.name,
    description: `${c.tagline}. Handmade in Nepal — shop the ${c.name} collection at Wild Muse.`,
    alternates: { canonical: `/collections/${c.slug}` },
  };
}

export default async function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  const collection = await getCollection((await params).slug);
  if (!collection) notFound();
  const [products, all] = await Promise.all([getProducts({ collection: collection.slug }), getCollections()]);
  return (
    <SimpleListingPage
      title={collection.name}
      intro={collection.tagline}
      crumbs={[{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: collection.name }]}
      products={products}
      chips={all.map((c) => ({ label: c.name, href: `/collections/${c.slug}` }))}
      activeChip={`/collections/${collection.slug}`}
    />
  );
}
