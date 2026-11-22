import Link from "next/link";
import { Artwork } from "@/components/brand/artwork";
import { SectionHeading } from "@/components/ui/section-heading";
import type { ArtworkKind, ArtworkTone } from "@/lib/catalog/types";

const tiles: { href: string; name: string; kind: ArtworkKind; tone: ArtworkTone }[] = [
  { href: "/women", name: "Women", kind: "dress", tone: "terracotta" },
  { href: "/men", name: "Men", kind: "shirt", tone: "olive" },
  { href: "/kids", name: "Kids", kind: "hat", tone: "mustard" },
  { href: "/accessories", name: "Accessories", kind: "necklace", tone: "chocolate" },
];

export function CategoryTiles() {
  return (
    <section className="container-page py-16 md:py-24" aria-labelledby="shop-by-heading">
      <SectionHeading id="shop-by-heading" eyebrow="Shop by category" title="Find your fit" align="center" />
      <ul className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="group block">
              <div className="aspect-[3/4] overflow-hidden rounded-t-[999px] bg-sand">
                <Artwork
                  kind={t.kind}
                  tone={t.tone}
                  label={`Shop ${t.name} (placeholder image)`}
                  className="transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <p className="mt-4 text-center font-display text-2xl transition-colors group-hover:text-terracotta">{t.name}</p>
              <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-bark">Shop now</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
