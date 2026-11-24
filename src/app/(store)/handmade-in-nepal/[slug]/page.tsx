import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Artwork } from "@/components/brand/artwork";
import { ContentRenderer } from "@/components/content/content-renderer";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getHandmadePage, getHandmadePages } from "@/server/content/pages";
import { getPublicArtisans } from "@/server/artisans";

export async function generateStaticParams() {
  const pages = await getHandmadePages().catch(() => []);
  return pages.length ? pages.map((p) => ({ slug: p.slug })) : [{ slug: "our-nepal-story" }];
}

export async function generateMetadata({ params }: PageProps<"/handmade-in-nepal/[slug]">): Promise<Metadata> {
  const page = await getHandmadePage((await params).slug);
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: `/handmade-in-nepal/${page.slug}` } };
}

export default async function HandmadeStoryPage({ params }: PageProps<"/handmade-in-nepal/[slug]">) {
  const page = await getHandmadePage((await params).slug);
  if (!page) notFound();
  const art = page.art ?? { kind: "loom" as const, tone: "sand" as const };
  const others = (await getHandmadePages()).filter((p) => p.slug !== page.slug);
  return (
    <>
      <div className="texture-grain border-b border-sand bg-cream">
        <div className="container-page grid items-center gap-8 py-8 md:grid-cols-2 md:py-12">
          <div>
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Handmade in Nepal", href: "/handmade-in-nepal" }, { label: page.title }]} />
            <p className="eyebrow mt-6 text-terracotta">{page.eyebrow}</p>
            <h1 className="mt-3 font-display text-display-lg font-light">{page.title}</h1>
            <p className="mt-4 max-w-md text-lg text-bark">{page.summary}</p>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-t-[999px]">
            <Artwork kind={art.kind} tone={art.tone} label={`${page.title} (placeholder image)`} />
          </div>
        </div>
      </div>
      <div className="container-page grid gap-12 py-10 md:py-14 lg:grid-cols-12">
        <article className="lg:col-span-8">
          <ContentRenderer blocks={page.blocks} />
          {page.slug === "meet-the-artisans" && <ArtisanProfiles />}
        </article>
        <nav aria-label="More from Handmade in Nepal" className="lg:col-span-4">
          <div className="rounded-[2px] border border-sand p-5 lg:sticky lg:top-36">
            <p className="eyebrow mb-3 text-bark">More stories</p>
            <ul className="space-y-2 text-sm">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/handmade-in-nepal/${o.slug}`} className="hover:text-terracotta hover:underline underline-offset-4">
                    {o.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </>
  );
}

/** Only artisans with recorded consent are ever shown. */
async function ArtisanProfiles() {
  const artisans = await getPublicArtisans();
  if (!artisans.length) return null;
  return (
    <ul className="mt-10 grid gap-6 sm:grid-cols-2">
      {artisans.map((a) => (
        <li key={a.id} className="rounded-[2px] bg-cream p-5">
          {a.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded artisan photo (already resized)
            <img
              src={a.photoUrl}
              alt={`${a.displayName}, ${a.craft}`}
              className="mb-4 aspect-[4/3] w-full rounded-[2px] object-cover"
              loading="lazy"
            />
          )}
          <h2 className="font-display text-2xl">{a.displayName}</h2>
          <p className="eyebrow mt-1 text-terracotta">
            {a.craft}
            {a.region && ` · ${a.region}`}
          </p>
          {a.story && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-bark">{a.story}</p>}
        </li>
      ))}
    </ul>
  );
}
