"use server";

import { z } from "zod";
import { fail, ok } from "@/app/actions/result";
import { textToBlocks } from "@/lib/content/markdown";
import { zBool, zOptText, zSlug } from "@/lib/zod-helpers";
import { adminAction, AdminError, formToObject } from "@/server/admin/action";
import { assertPermission } from "@/server/auth/session";
import { expire, TAGS } from "@/server/cache";
import { db } from "@/server/db";
import { audit } from "@/server/security/audit";
import { getSettings, saveSetting } from "@/server/settings";
import { newKey, processImage, putObject, UploadError } from "@/server/storage";

const CORE = [
  "pages/terms",
  "pages/privacy",
  "pages/cookies",
  "pages/returns",
  "pages/delivery",
  "pages/contact",
  "pages/faqs",
  "pages/about",
  "pages/size-guide",
  "pages/review-policy",
  "pages/wholesale",
];

const pageSchema = z.object({
  id: z.string().max(40).optional(),
  section: z.enum(["pages", "handmade"]).default("pages"),
  slug: zSlug.optional(),
  title: z.string().trim().min(2).max(100),
  eyebrow: zOptText(40),
  summary: zOptText(200),
  description: z.string().trim().min(10, "Add a meta description (used by Google)").max(170),
  body: z.string().max(50_000),
  requiresLegalReview: zBool,
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const savePage = adminAction(
  "content.manage",
  pageSchema,
  async (d, actor) => {
    const blocks = textToBlocks(d.body);
    if (!blocks.length) throw new AdminError("The page body is empty.");
    const data = {
      title: d.title,
      eyebrow: d.eyebrow,
      summary: d.summary,
      description: d.description,
      blocks: blocks as object[],
      requiresLegalReview: d.requiresLegalReview,
      status: d.status,
    };
    let id = d.id;
    if (id) {
      const before = await db.contentPage.findUnique({ where: { id } });
      if (!before) throw new AdminError("Page not found.");
      await db.contentPage.update({ where: { id }, data });
      await audit(
        actor,
        "content.update",
        { type: "ContentPage", id },
        { summary: before.path, before: { title: before.title, blocks: before.blocks }, after: { title: d.title } },
      );
    } else {
      if (!d.slug) throw new AdminError("Choose a URL slug for the new page.");
      const created = await db.contentPage.create({ data: { ...data, path: `${d.section}/${d.slug}` } });
      id = created.id;
      await audit(actor, "content.create", { type: "ContentPage", id }, { summary: created.path });
    }
    return ok({ id }, "Page saved");
  },
  { tags: [TAGS.content] },
);
export async function savePageAction(fd: FormData) {
  return savePage(formToObject(fd));
}

const deletePage = adminAction(
  "content.manage",
  z.object({ id: z.string().max(40) }),
  async ({ id }, actor) => {
    const p = await db.contentPage.findUnique({ where: { id } });
    if (!p) throw new AdminError("Page not found.");
    if (CORE.includes(p.path)) throw new AdminError("This page is required (linked from the footer/checkout). Unpublish or edit it instead.");
    await db.contentPage.delete({ where: { id } });
    await audit(actor, "content.delete", { type: "ContentPage", id }, { summary: p.path });
    return ok(null, "Page deleted");
  },
  { tags: [TAGS.content] },
);
export async function deletePageAction(fd: FormData) {
  return deletePage(formToObject(fd));
}

const homepage = adminAction(
  "content.manage",
  z.object({
    eyebrow: z.string().trim().max(60),
    heading: z.string().trim().min(2).max(60),
    subheading: z.string().trim().max(200),
    cta1Label: z.string().trim().max(30),
    cta1Href: z.string().trim().max(200).regex(/^\//, "Use a site path starting with /"),
    cta2Label: z.string().trim().max(30).optional(),
    cta2Href: z.string().trim().max(200).optional(),
    cta3Label: z.string().trim().max(30).optional(),
    cta3Href: z.string().trim().max(200).optional(),
    announcements: z.string().max(1000),
    slogan: z.string().trim().min(2).max(80),
  }),
  async (d, actor) => {
    const s = await getSettings();
    const ctas = [
      [d.cta1Label, d.cta1Href],
      [d.cta2Label, d.cta2Href],
      [d.cta3Label, d.cta3Href],
    ]
      .filter(([l, h]) => l && h && h.startsWith("/"))
      .map(([label, href]) => ({ label: label!, href: href! }));
    await saveSetting("hero", { ...s.hero, eyebrow: d.eyebrow, heading: d.heading, subheading: d.subheading, ctas });
    await saveSetting(
      "announcements",
      d.announcements
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 6),
    );
    await saveSetting("slogan", d.slogan);
    await audit(actor, "settings.homepage", { type: "SiteSetting", id: "hero" }, { summary: d.heading });
    return ok(null, "Homepage updated");
  },
  { tags: [TAGS.settings] },
);
export async function saveHomepageAction(fd: FormData) {
  return homepage(formToObject(fd));
}

export async function uploadHeroImageAction(fd: FormData) {
  const actor = await assertPermission("content.manage").catch(() => null);
  if (!actor) return fail("Not allowed.");
  const slot = fd.get("slot") === "secondary" ? "secondaryImageUrl" : "primaryImageUrl";
  const file = fd.get("file");
  const s = await getSettings();
  if (fd.get("remove") === "1") {
    await saveSetting("hero", { ...s.hero, [slot]: "" });
    expire(TAGS.settings);
    return ok(null, "Image removed — the illustration will show instead");
  }
  if (!(file instanceof File) || !file.size) return fail("Choose an image.");
  try {
    const img = await processImage(file, { maxEdge: 2400 });
    const stored = await putObject(newKey("hero", img.ext), img.buffer, img.contentType, "public");
    await saveSetting("hero", { ...s.hero, [slot]: stored.url! });
  } catch (e) {
    return fail(e instanceof UploadError ? e.message : "Upload failed.");
  }
  await audit(actor, "settings.hero.image", { type: "SiteSetting", id: "hero" }, { summary: slot });
  expire(TAGS.settings);
  return ok(null, "Hero image updated");
}
