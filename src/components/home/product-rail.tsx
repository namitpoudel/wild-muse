import { ProductCard } from "@/components/product/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Product } from "@/lib/catalog/types";

export function ProductRail({
  id,
  eyebrow,
  title,
  intro,
  href,
  products,
  tone = "linen",
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  href: string;
  products: Product[];
  tone?: "linen" | "cream";
}) {
  if (!products.length) return null;
  return (
    <section className={tone === "cream" ? "bg-cream" : undefined} aria-labelledby={id}>
      <div className="container-page py-16 md:py-24">
        <SectionHeading id={id} eyebrow={eyebrow} title={title} intro={intro} href={href} />
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-none md:mx-0 md:grid md:grid-cols-3 md:gap-x-5 md:gap-y-12 md:overflow-visible md:px-0 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} className="w-[68vw] shrink-0 snap-start sm:w-[42vw] md:w-auto" />
          ))}
        </div>
      </div>
    </section>
  );
}
