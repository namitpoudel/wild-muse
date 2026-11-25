/**
 * Seed script — idempotent (safe to run repeatedly).
 *
 *   npm run db:seed                 → reference data + DEMO catalogue (development)
 *   SEED_DEMO=false npm run db:seed → reference data only (production first run)
 *
 * Demo products are flagged `isDemo` so they can be bulk-removed from Admin → Products.
 * No reviews, orders or customers are ever seeded.
 */
import { handmadePages } from "../src/content/handmade";
import { contentPages } from "../src/content/pages";
import { categories } from "../src/lib/catalog/categories";
import { demoCollections, demoProducts } from "../src/lib/catalog/demo-data";
import { Department } from "../src/generated/prisma/enums";
import { scriptClient } from "./client";

const db = scriptClient();
const DEPT: Record<string, Department> = { women: "WOMEN", men: "MEN", kids: "KIDS", accessories: "ACCESSORIES" };

async function main() {
  const withDemo = process.env.SEED_DEMO !== "false";

  // Tax classes — rates editable in Admin → Settings. Confirm VAT treatment with an accountant.
  const standard = await db.taxClass.upsert({
    where: { name: "Standard rate" },
    create: { name: "Standard rate", rateBps: 2000, isDefault: true, description: "UK standard rate VAT (most clothing and accessories)." },
    update: {},
  });
  await db.taxClass.upsert({
    where: { name: "Zero rate" },
    create: {
      name: "Zero rate",
      rateBps: 0,
      description: "e.g. qualifying young children's clothing (HMRC VAT Notice 714) — confirm eligibility per product.",
    },
    update: {},
  });

  // Shipping methods — prices editable in Admin → Settings → Delivery.
  await db.shippingMethod.upsert({
    where: { code: "uk-standard" },
    create: {
      code: "uk-standard",
      name: "UK Standard",
      description: "Tracked, 2–4 working days",
      pricePence: 395,
      freeOverPence: 7500,
      estimatedMinDays: 2,
      estimatedMaxDays: 4,
      sortOrder: 0,
    },
    update: {},
  });
  await db.shippingMethod.upsert({
    where: { code: "uk-express" },
    create: {
      code: "uk-express",
      name: "UK Express",
      description: "Tracked, next working day if ordered by 1pm",
      pricePence: 695,
      estimatedMinDays: 1,
      estimatedMaxDays: 1,
      sortOrder: 1,
    },
    update: {},
  });

  // Category tree
  let order = 0;
  for (const c of categories) {
    await db.category.upsert({
      where: { department_slug: { department: DEPT[c.department], slug: c.slug } },
      create: { department: DEPT[c.department], slug: c.slug, name: c.name, groupName: c.group, sortOrder: order++ },
      update: { sortOrder: order },
    });
  }

  // CMS pages
  for (const [i, p] of contentPages.entries()) {
    await db.contentPage.upsert({
      where: { path: `pages/${p.slug}` },
      create: {
        path: `pages/${p.slug}`,
        title: p.title,
        eyebrow: p.eyebrow,
        description: p.description,
        blocks: p.blocks as object[],
        requiresLegalReview: !!p.requiresLegalReview,
        sortOrder: i,
      },
      update: {},
    });
  }
  for (const [i, p] of handmadePages.entries()) {
    await db.contentPage.upsert({
      where: { path: `handmade/${p.slug}` },
      create: {
        path: `handmade/${p.slug}`,
        title: p.title,
        eyebrow: p.eyebrow,
        summary: p.summary,
        description: p.description,
        blocks: p.blocks as object[],
        artKind: p.art.kind,
        artTone: p.art.tone,
        sortOrder: i,
      },
      update: {},
    });
  }

  // Collections
  for (const [i, c] of demoCollections.entries()) {
    await db.collection.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name, tagline: c.tagline, artKind: c.image.kind, artTone: c.image.tone, sortOrder: i },
      update: {},
    });
  }

  if (withDemo) {
    for (const p of demoProducts) {
      const category = await db.category.findUniqueOrThrow({ where: { department_slug: { department: DEPT[p.department], slug: p.categorySlug } } });
      const exists = await db.product.findUnique({ where: { slug: p.slug } });
      if (exists) continue;
      const created = await db.product.create({
        data: {
          slug: p.slug,
          name: p.name,
          department: DEPT[p.department],
          categoryId: category.id,
          status: "PUBLISHED",
          shortDescription: p.shortDescription,
          description: p.description,
          pricePence: p.pricePence,
          compareAtPricePence: p.compareAtPricePence ?? null,
          fibreComposition: p.fibreComposition,
          materials: p.materials,
          care: p.care,
          countryOfOrigin: p.countryOfOrigin,
          isHandmade: p.isHandmade,
          craftStory: p.craftStory ?? null,
          isFeatured: p.isFeatured,
          bestsellerRank: p.bestsellerRank ?? null,
          sizeGuide: p.sizeGuide ?? null,
          artKind: p.images[0].kind,
          artTones: p.images.map((i) => i.tone),
          isDemo: true,
          taxClassId: standard.id,
          publishedAt: new Date(p.publishedAt),
          colours: { create: p.colours.map((c, i) => ({ name: c.name, hex: c.hex, sortOrder: i })) },
          variants: {
            create: p.variants.map((v, i) => ({ sku: v.sku, size: v.size, colour: v.colour, stockOnHand: v.stock, sortOrder: i })),
          },
        },
        include: { variants: true },
      });
      await db.stockMovement.createMany({
        data: created.variants
          .filter((v) => v.stockOnHand > 0)
          .map((v) => ({ variantId: v.id, type: "RECEIVE" as const, quantity: v.stockOnHand, reason: "Demo opening stock" })),
      });
      for (const slug of p.collectionSlugs) {
        const col = await db.collection.findUnique({ where: { slug } });
        if (col) await db.collectionProduct.create({ data: { collectionId: col.id, productId: created.id } });
      }
    }
  }

  const counts = {
    products: await db.product.count(),
    variants: await db.productVariant.count(),
    categories: await db.category.count(),
    pages: await db.contentPage.count(),
  };
  console.log(`Seed complete (demo catalogue: ${withDemo ? "yes" : "no"})`, counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
