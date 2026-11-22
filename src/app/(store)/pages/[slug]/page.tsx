import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPageView } from "@/components/content/content-page-view";
import { HelpAside } from "@/components/content/help-aside";
import { contentPages, getContentPage } from "@/content/pages";

export function generateStaticParams() {
  return contentPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/pages/[slug]">): Promise<Metadata> {
  const page = getContentPage((await params).slug);
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: `/pages/${page.slug}` } };
}

export default async function InfoPage({ params }: PageProps<"/pages/[slug]">) {
  const page = getContentPage((await params).slug);
  if (!page) notFound();
  return (
    <ContentPageView
      page={page}
      crumbs={[{ label: "Home", href: "/" }, { label: page.title }]}
      aside={<HelpAside current={`/pages/${page.slug}`} />}
    />
  );
}
