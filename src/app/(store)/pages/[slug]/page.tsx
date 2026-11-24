import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPageView } from "@/components/content/content-page-view";
import { HelpAside } from "@/components/content/help-aside";
import { getInfoPage, getInfoPages } from "@/server/content/pages";

export async function generateStaticParams() {
  const pages = await getInfoPages().catch(() => []);
  return pages.length ? pages.map((p) => ({ slug: p.slug })) : [{ slug: "about" }];
}

export async function generateMetadata({ params }: PageProps<"/pages/[slug]">): Promise<Metadata> {
  const page = await getInfoPage((await params).slug);
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: `/pages/${page.slug}` } };
}

export default async function InfoPage({ params }: PageProps<"/pages/[slug]">) {
  const page = await getInfoPage((await params).slug);
  if (!page) notFound();
  return (
    <ContentPageView
      page={page}
      crumbs={[{ label: "Home", href: "/" }, { label: page.title }]}
      aside={<HelpAside current={`/pages/${page.slug}`} />}
    />
  );
}
