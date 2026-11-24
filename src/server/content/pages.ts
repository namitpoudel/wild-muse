import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { ArtworkKind, ArtworkTone } from "@/lib/catalog/types";
import type { ContentBlock, ContentPage } from "@/lib/content/types";
import { db } from "../db";

export interface StoredPage extends ContentPage {
  path: string;
  summary?: string;
  art?: { kind: ArtworkKind; tone: ArtworkTone };
}

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

async function allPages(): Promise<StoredPage[]> {
  "use cache";
  cacheTag("content");
  cacheLife("hours");
  const rows = await db.contentPage.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ sortOrder: "asc" }] });
  return rows.map((r) => ({
    path: r.path,
    slug: r.path.split("/")[1],
    title: r.title,
    eyebrow: r.eyebrow ?? undefined,
    summary: r.summary ?? undefined,
    description: r.description,
    requiresLegalReview: r.requiresLegalReview,
    lastUpdated: fmt.format(r.updatedAt),
    blocks: r.blocks as unknown as ContentBlock[],
    art: r.artKind ? { kind: r.artKind as ArtworkKind, tone: (r.artTone ?? "sand") as ArtworkTone } : undefined,
  }));
}

export async function getInfoPage(slug: string) {
  return (await allPages()).find((p) => p.path === `pages/${slug}`) ?? null;
}
export async function getInfoPages() {
  return (await allPages()).filter((p) => p.path.startsWith("pages/"));
}
export async function getHandmadePage(slug: string) {
  return (await allPages()).find((p) => p.path === `handmade/${slug}`) ?? null;
}
export async function getHandmadePages() {
  return (await allPages()).filter((p) => p.path.startsWith("handmade/"));
}
