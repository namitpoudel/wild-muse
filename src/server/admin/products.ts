import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { ProductFormData } from "@/components/admin/product-form";
import { db } from "../db";

export const toPounds = (pence: number | null | undefined) => (pence === null || pence === undefined ? "" : (pence / 100).toFixed(2));

export async function getProductFormOptions() {
  const [categories, collections, taxClasses, suppliers] = await Promise.all([
    db.category.findMany({ orderBy: [{ department: "asc" }, { sortOrder: "asc" }], select: { id: true, name: true, department: true } }),
    db.collection.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.taxClass.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { categories, collections, taxClasses, suppliers };
}

export async function getProductForEdit(id: string): Promise<ProductFormData | null> {
  const p = await db.product.findUnique({
    where: { id },
    include: {
      colours: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      collections: true,
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    department: p.department,
    categoryId: p.categoryId,
    status: p.status,
    shortDescription: p.shortDescription,
    description: p.description,
    price: toPounds(p.pricePence),
    compareAt: toPounds(p.compareAtPricePence),
    fibreComposition: p.fibreComposition,
    materials: p.materials,
    care: p.care.join("\n"),
    countryOfOrigin: p.countryOfOrigin,
    commodityCode: p.commodityCode ?? "",
    isHandmade: p.isHandmade,
    craftStory: p.craftStory ?? "",
    isFeatured: p.isFeatured,
    bestsellerRank: p.bestsellerRank?.toString() ?? "",
    sizeGuide: p.sizeGuide ?? "",
    taxClassId: p.taxClassId ?? "",
    supplierId: p.supplierId ?? "",
    unitCost: toPounds(p.unitCostPence),
    complianceChecked: p.complianceChecked,
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    artKind: p.artKind,
    artTones: p.artTones.join(", "),
    collectionIds: p.collections.map((c) => c.collectionId),
    colours: p.colours.map((c) => ({ name: c.name, hex: c.hex })),
    variants: p.variants
      .filter((v) => v.isActive || v.stockOnHand > 0)
      .map((v) => ({
        id: v.id,
        colour: v.colour,
        size: v.size,
        sku: v.sku,
        stock: v.stockOnHand,
        reserved: v.stockReserved,
        price: toPounds(v.pricePence),
        isActive: v.isActive,
      })),
    images: p.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, type: i.type })),
    isDemo: p.isDemo,
  };
}

export const EMPTY_PRODUCT: ProductFormData = {
  name: "",
  slug: "",
  department: "WOMEN",
  categoryId: "",
  status: "DRAFT",
  shortDescription: "",
  description: "",
  price: "",
  compareAt: "",
  fibreComposition: "",
  materials: "",
  care: "",
  countryOfOrigin: "Nepal",
  commodityCode: "",
  isHandmade: true,
  craftStory: "",
  isFeatured: false,
  bestsellerRank: "",
  sizeGuide: "womens-clothing",
  taxClassId: "",
  supplierId: "",
  unitCost: "",
  complianceChecked: false,
  seoTitle: "",
  seoDescription: "",
  artKind: "dress",
  artTones: "terracotta, sand",
  collectionIds: [],
  colours: [{ name: "Natural", hex: "#EFE6D6" }],
  variants: [],
  images: [],
};

export async function listProducts(f: { q?: string; status?: string; dept?: string; demo?: boolean; page: number }) {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(f.q
      ? {
          OR: [
            { name: { contains: f.q, mode: "insensitive" } },
            { slug: { contains: f.q } },
            { variants: { some: { sku: { contains: f.q, mode: "insensitive" } } } },
          ],
        }
      : {}),
    ...(f.status ? { status: f.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}),
    ...(f.dept ? { department: f.dept as "WOMEN" } : {}),
    ...(f.demo ? { isDemo: true } : {}),
  };
  const take = 25;
  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (f.page - 1) * take,
      take,
      include: {
        category: { select: { name: true } },
        variants: { select: { stockOnHand: true, stockReserved: true, isActive: true } },
        images: { take: 1, orderBy: { sortOrder: "asc" } },
      },
    }),
    db.product.count({ where }),
  ]);
  return { rows, total, pages: Math.max(1, Math.ceil(total / take)) };
}
