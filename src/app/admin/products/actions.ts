"use server";

import { z } from "zod";
import { fail, ok, type ActionResult } from "@/app/actions/result";
import { slugify, zBool, zInt, zOptText, zPence, zSlug } from "@/lib/zod-helpers";
import { adminAction, AdminError, formToObject } from "@/server/admin/action";
import { assertPermission } from "@/server/auth/session";
import { expire, TAGS } from "@/server/cache";
import { db } from "@/server/db";
import { audit } from "@/server/security/audit";
import { deleteObject, newKey, processImage, processVideo, putObject, UploadError } from "@/server/storage";

const variantSchema = z.object({
  id: z.string().max(40).optional(),
  colour: z.string().trim().min(1).max(40),
  size: z.string().trim().min(1).max(20),
  sku: z.string().trim().max(60).optional(),
  stock: z.number().int().min(0).max(100000),
  pricePence: z.number().int().min(1).max(10_000_000).nullable().optional(),
  isActive: z.boolean(),
});
const colourSchema = z.object({
  name: z.string().trim().min(1).max(40),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #A84A2A"),
});

const productSchema = z
  .object({
    id: z.string().max(40).optional(),
    name: z.string().trim().min(2, "Enter a product name").max(120),
    slug: z.preprocess((v) => (v ? v : undefined), zSlug.optional()),
    department: z.enum(["WOMEN", "MEN", "KIDS", "ACCESSORIES"]),
    categoryId: z.string().min(1, "Choose a category").max(40),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    shortDescription: z.string().trim().min(5, "Add a short description").max(240),
    description: z.string().trim().min(10, "Add a description").max(5000),
    pricePence: zPence.refine((v) => v !== undefined && v > 0, "Enter a price"),
    compareAtPricePence: zPence,
    fibreComposition: z.string().trim().min(2, "Fibre composition is legally required for textiles (or 'Not applicable')").max(240),
    materials: z.string().trim().min(2).max(240),
    care: z.string().max(1000).default(""),
    countryOfOrigin: z.string().trim().min(2).max(60),
    commodityCode: zOptText(20),
    isHandmade: zBool,
    craftStory: zOptText(1000),
    isFeatured: zBool,
    bestsellerRank: zInt(1, 999),
    sizeGuide: zOptText(40),
    taxClassId: zOptText(40),
    supplierId: zOptText(40),
    unitCostPence: zPence,
    complianceChecked: zBool,
    seoTitle: zOptText(70),
    seoDescription: zOptText(170),
    artKind: z.string().max(20).default("dress"),
    artTones: z.string().max(100).default("sand"),
    collectionIds: z.preprocess((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]), z.array(z.string().max(40)).max(50)),
    colours: z.preprocess((v) => JSON.parse(String(v ?? "[]")), z.array(colourSchema).max(30)),
    variants: z.preprocess((v) => JSON.parse(String(v ?? "[]")), z.array(variantSchema).max(400)),
  })
  .superRefine((d, ctx) => {
    if (d.compareAtPricePence && d.pricePence && d.compareAtPricePence <= d.pricePence)
      ctx.addIssue({ code: "custom", path: ["compareAtPricePence"], message: "The 'was' price must be higher than the selling price" });
    if (d.status === "PUBLISHED" && !d.variants.some((v) => v.isActive))
      ctx.addIssue({ code: "custom", path: ["variants"], message: "Add at least one active size/colour before publishing" });
    if (d.status === "PUBLISHED" && !d.complianceChecked)
      ctx.addIssue({ code: "custom", path: ["complianceChecked"], message: "Confirm labelling & safety checks before publishing" });
    const keys = new Set<string>();
    for (const v of d.variants) {
      const k = `${v.colour}|${v.size}`.toLowerCase();
      if (keys.has(k)) ctx.addIssue({ code: "custom", path: ["variants"], message: `Duplicate variant ${v.colour} / ${v.size}` });
      keys.add(k);
    }
  });

const save = adminAction(
  "products.write",
  productSchema,
  async (d, actor) => {
    const slug = d.slug ?? slugify(d.name);
    const category = await db.category.findUnique({ where: { id: d.categoryId } });
    if (!category || category.department !== d.department) throw new AdminError("Choose a category from the selected department.");
    const existing = d.id ? await db.product.findUnique({ where: { id: d.id }, include: { variants: true } }) : null;
    if (d.id && !existing) throw new AdminError("Product not found.");
    const before = existing ? { name: existing.name, pricePence: existing.pricePence, status: existing.status } : undefined;

    const base = {
      name: d.name,
      slug,
      department: d.department,
      categoryId: d.categoryId,
      status: d.status,
      shortDescription: d.shortDescription,
      description: d.description,
      pricePence: d.pricePence!,
      compareAtPricePence: d.compareAtPricePence ?? null,
      fibreComposition: d.fibreComposition,
      materials: d.materials,
      care: d.care
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 12),
      countryOfOrigin: d.countryOfOrigin,
      commodityCode: d.commodityCode,
      isHandmade: d.isHandmade,
      craftStory: d.craftStory,
      isFeatured: d.isFeatured,
      bestsellerRank: d.bestsellerRank ?? null,
      sizeGuide: d.sizeGuide,
      taxClassId: d.taxClassId,
      supplierId: d.supplierId,
      unitCostPence: d.unitCostPence ?? null,
      complianceChecked: d.complianceChecked,
      seoTitle: d.seoTitle,
      seoDescription: d.seoDescription,
      artKind: d.artKind,
      artTones: d.artTones
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 6),
      publishedAt: d.status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
    };

    const product = await db.$transaction(async (tx) => {
      const p = existing ? await tx.product.update({ where: { id: existing.id }, data: base }) : await tx.product.create({ data: base });

      // Colours
      await tx.productColour.deleteMany({ where: { productId: p.id } });
      if (d.colours.length)
        await tx.productColour.createMany({ data: d.colours.map((c, i) => ({ productId: p.id, name: c.name, hex: c.hex, sortOrder: i })) });

      // Collections
      await tx.collectionProduct.deleteMany({ where: { productId: p.id } });
      if (d.collectionIds.length)
        await tx.collectionProduct.createMany({ data: d.collectionIds.map((cid) => ({ collectionId: cid, productId: p.id })), skipDuplicates: true });

      // Variants + stock (every change is written to the stock ledger)
      const keep = new Set<string>();
      for (const [i, v] of d.variants.entries()) {
        const sku = (v.sku || `WM-${slug.slice(0, 18)}-${v.colour.slice(0, 3)}-${v.size}`).toUpperCase().replace(/[^A-Z0-9-]/g, "");
        const prev = existing?.variants.find((x) => x.id === v.id) ?? existing?.variants.find((x) => x.colour === v.colour && x.size === v.size);
        if (prev) {
          if (v.stock < prev.stockReserved)
            throw new AdminError(`${v.colour}/${v.size}: stock can't go below the ${prev.stockReserved} units reserved by open checkouts.`);
          await tx.productVariant.update({
            where: { id: prev.id },
            data: { colour: v.colour, size: v.size, sku, pricePence: v.pricePence ?? null, isActive: v.isActive, stockOnHand: v.stock, sortOrder: i },
          });
          if (v.stock !== prev.stockOnHand)
            await tx.stockMovement.create({
              data: { variantId: prev.id, type: "ADJUST", quantity: v.stock - prev.stockOnHand, reason: "Edited in product form", userId: actor.id },
            });
          keep.add(prev.id);
        } else {
          const created = await tx.productVariant.create({
            data: {
              productId: p.id,
              colour: v.colour,
              size: v.size,
              sku,
              pricePence: v.pricePence ?? null,
              isActive: v.isActive,
              stockOnHand: v.stock,
              sortOrder: i,
            },
          });
          if (v.stock > 0)
            await tx.stockMovement.create({
              data: { variantId: created.id, type: "RECEIVE", quantity: v.stock, reason: "Initial stock", userId: actor.id },
            });
          keep.add(created.id);
        }
      }
      for (const old of existing?.variants ?? []) {
        if (keep.has(old.id)) continue;
        const used =
          (await tx.orderItem.count({ where: { variantId: old.id } })) + (await tx.purchaseOrderItem.count({ where: { variantId: old.id } }));
        if (used || old.stockReserved) await tx.productVariant.update({ where: { id: old.id }, data: { isActive: false } });
        else await tx.productVariant.delete({ where: { id: old.id } });
      }
      await audit(
        actor,
        existing ? "product.update" : "product.create",
        { type: "Product", id: p.id },
        { summary: p.name, before, after: { name: p.name, pricePence: p.pricePence, status: p.status } },
        tx,
      );
      return p;
    });
    return ok({ id: product.id, slug: product.slug }, existing ? "Product saved" : "Product created");
  },
  { tags: [TAGS.products, TAGS.collections] },
);

export async function saveProductAction(fd: FormData) {
  return save(formToObject(fd));
}

const remove = adminAction(
  "products.delete",
  z.object({ id: z.string().max(40) }),
  async ({ id }, actor) => {
    const p = await db.product.findUnique({ where: { id }, include: { variants: { select: { id: true, stockReserved: true } } } });
    if (!p) throw new AdminError("Product not found.");
    if (p.variants.some((v) => v.stockReserved > 0))
      throw new AdminError("This product is in an open checkout. Try again in 30 minutes, or unpublish it now.");
    const hasHistory = (await db.orderItem.count({ where: { productId: id } })) > 0;
    if (hasHistory) {
      // Keep order history intact: archive instead of deleting.
      await db.product.update({ where: { id }, data: { status: "ARCHIVED", deletedAt: new Date() } });
    } else {
      await db.product.delete({ where: { id } });
    }
    await audit(actor, hasHistory ? "product.archive" : "product.delete", { type: "Product", id }, { summary: p.name });
    return ok(null, hasHistory ? "Product archived (it has order history)" : "Product deleted");
  },
  { tags: [TAGS.products, TAGS.collections] },
);
export async function deleteProductAction(fd: FormData) {
  return remove(formToObject(fd));
}

const removeDemo = adminAction(
  "products.delete",
  z.object({ confirm: z.literal("DELETE DEMO", { message: "Type DELETE DEMO to confirm" }) }),
  async (_d, actor) => {
    const demo = await db.product.findMany({ where: { isDemo: true }, select: { id: true } });
    let archived = 0;
    for (const p of demo) {
      if (await db.orderItem.count({ where: { productId: p.id } })) {
        await db.product.update({ where: { id: p.id }, data: { status: "ARCHIVED", deletedAt: new Date() } });
        archived++;
      } else await db.product.delete({ where: { id: p.id } });
    }
    await audit(actor, "product.demo.remove", { type: "Product" }, { summary: `Removed ${demo.length} demo products (${archived} archived)` });
    return ok(null, `Removed ${demo.length} demo products`);
  },
  { tags: [TAGS.products, TAGS.collections] },
);
export async function removeDemoProductsAction(fd: FormData) {
  return removeDemo(formToObject(fd));
}

/** Upload product images (re-encoded to WebP, metadata stripped) or a video. */
export async function uploadProductMediaAction(fd: FormData): Promise<ActionResult<{ count: number }>> {
  const actor = await assertPermission("products.write").catch(() => null);
  if (!actor) return fail("Not allowed.");
  const productId = String(fd.get("productId") ?? "");
  const alt = String(fd.get("alt") ?? "")
    .trim()
    .slice(0, 200);
  const colour =
    String(fd.get("colour") ?? "")
      .trim()
      .slice(0, 40) || null;
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, name: true, _count: { select: { images: true } } } });
  if (!product) return fail("Product not found.");
  const files = fd
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 10);
  if (!files.length) return fail("Choose at least one file.");
  if (product._count.images + files.length > 20) return fail("A product can have up to 20 images/videos.");
  try {
    let order = product._count.images;
    for (const f of files) {
      const isVideo = f.type.startsWith("video/");
      const media = isVideo ? await processVideo(f) : await processImage(f);
      const stored = await putObject(newKey(`products/${product.id}`, media.ext), media.buffer, media.contentType, "public");
      await db.productImage.create({
        data: {
          productId: product.id,
          url: stored.url!,
          alt: alt || `${product.name}${colour ? ` in ${colour}` : ""}`,
          type: isVideo ? "VIDEO" : "IMAGE",
          colour,
          width: "width" in media ? (media.width as number) : null,
          height: "height" in media ? (media.height as number) : null,
          sortOrder: order++,
        },
      });
    }
  } catch (e) {
    return fail(e instanceof UploadError ? e.message : "Upload failed. Nothing was saved.");
  }
  await audit(actor, "product.media.upload", { type: "Product", id: product.id }, { summary: `${files.length} file(s)` });
  expire(TAGS.products);
  return ok({ count: files.length }, `${files.length} file${files.length > 1 ? "s" : ""} uploaded`);
}

function keyFromUrl(url: string) {
  if (url.startsWith("/api/media/")) return url.slice("/api/media/".length);
  const m = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  return m?.[1] ?? null;
}

const mediaEdit = adminAction(
  "products.write",
  z.object({ imageId: z.string().max(40), op: z.enum(["delete", "up", "down", "alt"]), alt: z.string().trim().max(200).optional() }),
  async ({ imageId, op, alt }, actor) => {
    const img = await db.productImage.findUnique({ where: { id: imageId } });
    if (!img) throw new AdminError("Image not found.");
    if (op === "delete") {
      await db.productImage.delete({ where: { id: imageId } });
      const key = keyFromUrl(img.url);
      if (key) await deleteObject(key, "public").catch(() => {});
    } else if (op === "alt") {
      if (!alt) throw new AdminError("Alt text can't be empty (it's needed for accessibility).");
      await db.productImage.update({ where: { id: imageId }, data: { alt } });
    } else {
      const all = await db.productImage.findMany({ where: { productId: img.productId }, orderBy: { sortOrder: "asc" } });
      const i = all.findIndex((x) => x.id === imageId);
      const j = op === "up" ? i - 1 : i + 1;
      if (j >= 0 && j < all.length) {
        [all[i], all[j]] = [all[j], all[i]];
        await db.$transaction(all.map((x, n) => db.productImage.update({ where: { id: x.id }, data: { sortOrder: n } })));
      }
    }
    await audit(actor, `product.media.${op}`, { type: "Product", id: img.productId });
    return ok(null, op === "delete" ? "Removed" : "Updated");
  },
  { tags: [TAGS.products] },
);
export async function editProductMediaAction(fd: FormData) {
  return mediaEdit(formToObject(fd));
}
