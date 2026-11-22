import { Artwork } from "@/components/brand/artwork";
import { ButtonLink } from "@/components/ui/button";

const crafts = [
  {
    name: "Dhaka weaving",
    text: "Geometric cloth woven thread by thread on wooden handlooms — a tradition closely tied to the hill town of Palpa.",
  },
  {
    name: "Allo nettle fibre",
    text: "Fibre from the Himalayan giant nettle, traditionally harvested, spun and woven by women in Nepal's mid-hills.",
  },
  {
    name: "Hand-knitted wool",
    text: "Cardigans, hoodies and hats knitted by hand — warm, characterful and made to be worn for years.",
  },
];

export function HandmadeStory() {
  return (
    <section className="bg-olive-deep text-linen" aria-labelledby="handmade-heading">
      <div className="container-page grid gap-12 py-16 md:py-24 lg:grid-cols-12 lg:items-center">
        <div className="grid grid-cols-5 gap-3 lg:col-span-6">
          <div className="col-span-3 aspect-[3/4] overflow-hidden rounded-[2px]">
            <Artwork kind="loom" tone="sand" label="A handloom weaving Dhaka cloth (placeholder image)" />
          </div>
          <div className="col-span-2 flex flex-col gap-3 pt-12">
            <div className="aspect-square overflow-hidden rounded-full">
              <Artwork kind="landscape" tone="olive" label="Terraced hills in Nepal (placeholder image)" band={false} />
            </div>
            <div className="aspect-[3/4] overflow-hidden rounded-[2px]">
              <Artwork kind="knit" tone="cream" label="Hand-knitting a wool cardigan (placeholder image)" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <p className="eyebrow mb-4 text-mustard">Handmade in Nepal</p>
          <h2 id="handmade-heading" className="font-display text-display-lg font-light">
            Made by hands, <em className="text-sand">not machines.</em>
          </h2>
          <p className="mt-5 text-sand">
            We work with small workshops and independent makers across Nepal. Every piece carries the marks of the person who made it —
            and we&apos;ll always tell you exactly how, where and from what it was made.
          </p>
          <ul className="mt-8 space-y-5">
            {crafts.map((c, i) => (
              <li key={c.name} className="flex gap-4">
                <span className="font-display text-2xl text-mustard" aria-hidden>
                  0{i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-sm text-sand">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/handmade-in-nepal/our-nepal-story" variant="light">
              Our Nepal story
            </ButtonLink>
            <ButtonLink href="/handmade-in-nepal/meet-the-artisans" variant="outline-light">
              Meet the artisans
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
