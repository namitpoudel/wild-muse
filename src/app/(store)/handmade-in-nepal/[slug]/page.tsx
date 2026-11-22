import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Artwork } from "@/components/brand/artwork";
import { ContentRenderer } from "@/components/content/content-renderer";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getHandmadePage, handmadePages } from "@/content/handmade";

export function generateStaticParams() {
  return handmadePages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/handmade-in-nepal/[slug]">): Promise<Metadata> {
  const page = getHandmadePage((await params).slug);
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: `/handmade-in-nepal/${page.slug}` } };
}

export default async function HandmadeStoryPage({ params }: PageProps<"/handmade-in-nepal/[slug]">) {
  const page = getHandmadePage((await params).slug);
  if (!page) notFound();
  const others = handmadePages.filter((p) => p.slug !== page.slug);
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
            <Artwork kind={page.art.kind} tone={page.art.tone} label={`${page.title} (placeholder image)`} />
          </div>
        </div>
      </div>
      <div className="container-page grid gap-12 py-10 md:py-14 lg:grid-cols-12">
        <article className="lg:col-span-8">
          <ContentRenderer blocks={page.blocks} />
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
