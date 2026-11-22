import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Artwork } from "@/components/brand/artwork";
import { HandmadeStory } from "@/components/home/handmade-story";
import { ProductRail } from "@/components/home/product-rail";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { handmadePages } from "@/content/handmade";
import { getProducts } from "@/lib/catalog/queries";

export const metadata: Metadata = {
  title: "Handmade in Nepal",
  description: "Meet the craft behind Wild Muse: Dhaka weaving, allo nettle fibre, hand-knitted wool and the artisans of Nepal.",
  alternates: { canonical: "/handmade-in-nepal" },
};

export default async function HandmadeHubPage() {
  const handmade = (await getProducts({ sort: "newest" })).filter((p) => p.isHandmade).slice(0, 8);
  return (
    <>
      <section className="relative overflow-hidden bg-chocolate text-linen">
        <div className="absolute inset-0 opacity-40" aria-hidden>
          <Artwork kind="landscape" tone="chocolate" label="" />
        </div>
        {/* Gradient keeps text contrast ≥ 4.5:1 over the artwork/photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-chocolate via-chocolate/90 to-chocolate/40" aria-hidden />
        <div className="container-page relative py-16 md:py-28">
          <div className="[&_*]:!text-sand">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Handmade in Nepal" }]} />
          </div>
          <p className="eyebrow mt-8 text-mustard">Handmade in Nepal</p>
          <h1 className="mt-4 max-w-3xl font-display text-display-xl font-light">Every piece has a maker.</h1>
          <p className="mt-6 max-w-xl text-lg text-sand">
            Handlooms in the hills, knitting circles in Kathmandu, dye baths and beadwork. Discover the people, places and techniques behind Wild
            Muse.
          </p>
        </div>
      </section>
      <section className="container-page py-16 md:py-20" aria-label="Stories">
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {handmadePages.map((p) => (
            <li key={p.slug}>
              <Link href={`/handmade-in-nepal/${p.slug}`} className="group block">
                <div className="aspect-[3/2] overflow-hidden rounded-[2px]">
                  <Artwork kind={p.art.kind} tone={p.art.tone} label="" className="transition-transform duration-700 group-hover:scale-[1.04]" />
                </div>
                <h2 className="mt-4 font-display text-2xl group-hover:text-terracotta">{p.title}</h2>
                <p className="mt-1 text-sm text-bark">{p.summary}</p>
                <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]">
                  Read more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <HandmadeStory />
      <ProductRail id="handmade-products" eyebrow="Made by hand" title="Handmade pieces" href="/women/handmade-clothing" products={handmade} />
    </>
  );
}
