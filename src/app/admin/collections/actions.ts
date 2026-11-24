"use server";

import { z } from "zod";
import { fail, ok } from "@/app/actions/result";
import { slugify, zBool, zInt, zOptText, zSlug } from "@/lib/zod-helpers";
import { adminAction, AdminError, formToObject } from "@/server/admin/action";
import { assertPermission } from "@/server/auth/session";
import { expire, TAGS } from "@/server/cache";
import { db } from "@/server/db";
import { audit } from "@/server/security/audit";
import { newKey, processImage, putObject, UploadError } from "@/server/storage";

const categorySchema = z.object({
  id: z.string().max(40).optional(),
  department: z.enum(["WOMEN", "MEN", "KIDS", "ACCESSORIES"]),
  name: z.string().trim().min(2).max(60),
  slug: z.preprocess((v) => (v ? v : undefined), zSlug.optional()),
  groupName: z.string().trim().min(1, "Menu column heading").max(40),
  description: zOptText(300),
  sortOrder: zInt(0, 10000),
  isActive: zBool,
  seoTitle: zOptText(70),
  seoDescription: zOptText(170),
});

const saveCategory = adminAction(
  "products.write",
  categorySchema,
  async (d, actor) => {
    const data = { ...d, slug: d.slug ?? slugify(d.name), sortOrder: d.sortOrder ?? 0 };
    delete (data as { id?: string }).id;
    const c = d.id ? await db.category.update({ where: { id: d.id }, data }) : await db.category.create({ data });
    await audit(actor, d.id ? "category.update" : "category.create", { type: "Category", id: c.id }, { summary: `${c.department} / ${c.name}` });
    return ok(null, "Category saved");
  },
  { tags: [TAGS.categories, TAGS.products] },
);
export async function saveCategoryAction(fd: FormData) {
  return saveCategory(formToObject(fd));
}

const deleteCategory = adminAction(
  "products.delete",
  z.object({ id: z.string().max(40) }),
  async ({ id }, actor) => {
    const count = await db.product.count({ where: { categoryId: id } });
    if (count) throw new AdminError(`${count} product(s) use this category. Move them first, or hide the category instead.`);
    const c = await db.category.delete({ where: { id } });
    await audit(actor, "category.delete", { type: "Category", id }, { summary: c.name });
    return ok(null, "Category deleted");
  },
  { tags: [TAGS.categories] },
);
export async function deleteCategoryAction(fd: FormData) {
  return deleteCategory(formToObject(fd));
}

const collectionSchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(2).max(60),
  slug: z.preprocess((v) => (v ? v : undefined), zSlug.optional()),
  tagline: z.string().trim().min(2).max(120),
  description: zOptText(1000),
  artKind: z.string().max(20).default("dress"),
  artTone: z.string().max(20).default("terracotta"),
  isFeatured: zBool,
  isActive: zBool,
  sortOrder: zInt(0, 10000),
  seoTitle: zOptText(70),
  seoDescription: zOptText(170),
});

const saveCollection = adminAction(
  "products.write",
  collectionSchema,
  async (d, actor) => {
    const data = { ...d, slug: d.slug ?? slugify(d.name), sortOrder: d.sortOrder ?? 0 };
    delete (data as { id?: string }).id;
    const c = d.id ? await db.collection.update({ where: { id: d.id }, data }) : await db.collection.create({ data });
    await audit(actor, d.id ? "collection.update" : "collection.create", { type: "Collection", id: c.id }, { summary: c.name });
    return ok(null, "Collection saved");
  },
  { tags: [TAGS.collections, TAGS.products] },
);
export async function saveCollectionAction(fd: FormData) {
  return saveCollection(formToObject(fd));
}

const deleteCollection = adminAction(
  "products.delete",
  z.object({ id: z.string().max(40) }),
  async ({ id }, actor) => {
    const c = await db.collection.delete({ where: { id } });
    await audit(actor, "collection.delete", { type: "Collection", id }, { summary: c.name });
    return ok(null, "Collection deleted (products were not affected)");
  },
  { tags: [TAGS.collections, TAGS.products] },
);
export async function deleteCollectionAction(fd: FormData) {
  return deleteCollection(formToObject(fd));
}

export async function uploadCollectionImageAction(fd: FormData) {
  const actor = await assertPermission("products.write").catch(() => null);
  if (!actor) return fail("Not allowed.");
  const id = String(fd.get("id") ?? "");
  const file = fd.get("file");
  if (!(file instanceof File) || !file.size) return fail("Choose an image.");
  try {
    const img = await processImage(file);
    const stored = await putObject(newKey("collections", img.ext), img.buffer, img.contentType, "public");
    await db.collection.update({ where: { id }, data: { imageUrl: stored.url } });
  } catch (e) {
    return fail(e instanceof UploadError ? e.message : "Upload failed.");
  }
  await audit(actor, "collection.image", { type: "Collection", id });
  expire(TAGS.collections);
  return ok(null, "Image updated");
}
