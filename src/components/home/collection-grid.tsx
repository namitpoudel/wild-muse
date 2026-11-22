import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MediaImage } from "@/components/brand/artwork";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Collection } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

export function CollectionGrid({ collections }: { collections: Collection[] }) {
  return (
    <section className="container-page py-16 md:py-24" aria-labelledby="collections-heading">
      <SectionHeading
        id="collections-heading"
        eyebrow="Featured collections"
        title="Stories woven into every edit"
        href="/collections"
        linkLabel="All collections"
      />
      <ul className="grid auto-rows-[minmax(0,1fr)] grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {collections.map((c, i) => (
          <li key={c.slug} className={cn(i === 0 && "col-span-2 row-span-2")}>
            <Link href={`/collections/${c.slug}`} className="group relative block h-full overflow-hidden rounded-[2px]">
              <div className={cn("h-full", i === 0 ? "aspect-square" : "aspect-[4/5]")}>
                <MediaImage media={c.image} className="transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.04]" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-chocolate/85 via-chocolate/40 to-transparent p-4 pt-16 md:p-6 md:pt-20">
                <h3 className={cn("font-display text-linen", i === 0 ? "text-3xl md:text-4xl" : "text-lg md:text-xl")}>{c.name}</h3>
                <p className={cn("mt-1 text-sand", i === 0 ? "text-sm md:text-base" : "hidden text-xs sm:block")}>{c.tagline}</p>
              </div>
            </Link>
          </li>
        ))}
        <li className="col-span-2">
          <Link
            href="/collections"
            className="group flex h-full min-h-40 flex-col justify-between rounded-[2px] bg-olive p-6 text-linen transition-colors hover:bg-olive-deep md:p-8"
          >
            <p className="eyebrow text-sand">Explore</p>
            <p className="font-display text-2xl md:text-3xl">
              Every collection, <em>one free spirit.</em>
            </p>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]">
              Browse all <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
