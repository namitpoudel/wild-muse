import { MediaImage } from "@/components/brand/artwork";
import { ButtonLink } from "@/components/ui/button";
import type { MediaAsset } from "@/lib/catalog/types";

export interface HeroContent {
  eyebrow: string;
  heading: string;
  subheading: string;
  ctas: { label: string; href: string }[];
  /** Admin-replaceable imagery (Stage 4: HomepageSection config). */
  primaryImage?: MediaAsset;
  secondaryImage?: MediaAsset;
}

export function Hero({ content }: { content: HeroContent }) {
  const primary = content.primaryImage ?? { kind: "landscape", tone: "terracotta", alt: "Himalayan foothills at golden hour (placeholder image)" };
  const secondary = content.secondaryImage ?? { kind: "dress", tone: "sand", alt: "Model wearing a Dhaka-trim maxi dress (placeholder image)" };
  return (
    <section className="texture-grain relative overflow-hidden bg-cream" aria-labelledby="hero-heading">
      <div className="container-page grid items-center gap-12 py-8 md:py-14 lg:grid-cols-12 lg:gap-6 lg:py-20">
        <div className="relative order-1 lg:order-2 lg:col-span-6 lg:col-start-7">
          <div className="relative ml-auto aspect-square w-[72%] sm:aspect-[4/5] overflow-hidden rounded-t-[999px] shadow-lift sm:w-[70%] lg:w-[78%]">
            <MediaImage media={primary} priority />
          </div>
          <div className="absolute bottom-[-6%] left-0 aspect-[3/4] w-[38%] overflow-hidden rounded-[2px] border-[6px] border-cream shadow-lift sm:w-[36%] lg:w-[40%]">
            <MediaImage media={secondary} />
          </div>
          <div className="absolute right-[4%] top-[6%] hidden rotate-6 rounded-full bg-mustard px-4 py-6 text-center font-display text-sm italic leading-tight text-chocolate shadow-soft sm:block">
            Handmade
            <br />
            in Nepal
          </div>
        </div>
        <div className="order-2 lg:order-1 lg:col-span-6 animate-fade-up">
          <p className="eyebrow mb-5 text-terracotta">{content.eyebrow}</p>
          <h1 id="hero-heading" className="font-display text-display-xl font-light uppercase tracking-tight">
            {content.heading.split(" ").map((w, i, arr) =>
              i === arr.length - 2 ? (
                <em key={i} className="font-normal not-italic text-terracotta">
                  {w}{" "}
                </em>
              ) : (
                <span key={i}>{w} </span>
              ),
            )}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-bark">{content.subheading}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {content.ctas.map((c, i) => (
              <ButtonLink key={c.href} href={c.href} variant={i === 0 ? "primary" : i === 1 ? "dark" : "outline"} size="lg">
                {c.label}
              </ButtonLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
