import type { Metadata } from "next";
import Link from "next/link";
import { MediaImage } from "@/components/brand/artwork";
import { ListingHeader } from "@/components/listing/listing-header";
import { getCollections, getProducts } from "@/server/catalog/queries";

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore Wild Muse collections: The Bohemian Edit, Himalayan Heritage, Festival Freedom and more.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const [collections, products] = await Promise.all([getCollections(), getProducts()]);
  return (
    <>
      <ListingHeader
        title="Collections"
        intro="Edits built around a story, a season or a craft."
        crumbs={[{ label: "Home", href: "/" }, { label: "Collections" }]}
      />
      <div className="container-page py-12 md:py-16">
        <ul className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => {
            const count = products.filter((p) => p.collectionSlugs.includes(c.slug)).length;
            return (
              <li key={c.slug}>
                <Link href={`/collections/${c.slug}`} className="group block">
                  <div className="aspect-[4/5] overflow-hidden rounded-t-[999px] bg-sand">
                    <MediaImage media={c.image} className="transition-transform duration-700 group-hover:scale-[1.04]" />
                  </div>
                  <h2 className="mt-5 font-display text-2xl group-hover:text-terracotta">{c.name}</h2>
                  <p className="mt-1 text-sm text-bark">{c.tagline}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em]">
                    {count} {count === 1 ? "piece" : "pieces"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
