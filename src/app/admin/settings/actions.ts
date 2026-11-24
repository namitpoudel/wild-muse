"use server";

import { z } from "zod";
import { ok } from "@/app/actions/result";
import { zBool, zInt, zPence } from "@/lib/zod-helpers";
import { adminAction, AdminError, formToObject } from "@/server/admin/action";
import { TAGS } from "@/server/cache";
import { db } from "@/server/db";
import { audit } from "@/server/security/audit";
import { getSettings, saveSetting } from "@/server/settings";

const url = z.union([z.url().max(300), z.literal("")]);

const business = adminAction(
  "settings.manage",
  z.object({
    name: z.string().trim().min(2).max(60),
    legalName: z.string().trim().max(120),
    email: z.email().max(254),
    phone: z.string().trim().max(40),
    hours: z.string().trim().max(80),
    address: z.string().trim().max(200),
    companyNumber: z.string().trim().max(20),
    vatNumber: z.string().trim().max(20),
    instagram: url,
    tiktok: url,
    facebook: url,
  }),
  async (d, actor) => {
    const { instagram, tiktok, facebook, ...biz } = d;
    const before = await getSettings();
    await saveSetting("business", biz);
    await saveSetting("social", { instagram, tiktok, facebook });
    await audit(actor, "settings.business", { type: "SiteSetting", id: "business" }, { before: before.business, after: biz });
    return ok(null, "Business details saved");
  },
  { tags: [TAGS.settings] },
);
export async function saveBusinessAction(fd: FormData) {
  return business(formToObject(fd));
}

const commerce = adminAction(
  "settings.manage",
  z.object({
    returnDays: z.coerce.number().int().min(14, "UK law requires at least 14 days").max(365),
    newsletterDiscountPercent: z.coerce.number().int().min(0).max(50),
    reservationMinutes: z.coerce.number().int().min(10).max(120),
    allowGuestCheckout: zBool,
    vatRegistered: zBool,
    showVatOnInvoices: zBool,
    shippingTaxRatePercent: z.coerce.number().min(0).max(100),
    popularSearches: z.string().max(500),
    defaultTitle: z.string().trim().min(10).max(70),
    defaultDescription: z.string().trim().min(20).max(170),
  }),
  async (d, actor) => {
    const before = await getSettings();
    if (d.vatRegistered && !before.business.vatNumber) throw new AdminError("Add your VAT number under Business details before turning VAT on.");
    await saveSetting("commerce", {
      returnDays: d.returnDays,
      newsletterDiscountPercent: d.newsletterDiscountPercent,
      reservationMinutes: d.reservationMinutes,
      allowGuestCheckout: d.allowGuestCheckout,
    });
    await saveSetting("tax", {
      vatRegistered: d.vatRegistered,
      showVatOnInvoices: d.showVatOnInvoices,
      shippingTaxRateBps: Math.round(d.shippingTaxRatePercent * 100),
    });
    await saveSetting(
      "popularSearches",
      d.popularSearches
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10),
    );
    await saveSetting("seo", { defaultTitle: d.defaultTitle, defaultDescription: d.defaultDescription });
    await audit(
      actor,
      "settings.commerce",
      { type: "SiteSetting", id: "commerce" },
      { before: { tax: before.tax, commerce: before.commerce }, after: d },
    );
    return ok(null, "Settings saved");
  },
  { tags: [TAGS.settings] },
);
export async function saveCommerceAction(fd: FormData) {
  return commerce(formToObject(fd));
}

const shipping = adminAction(
  "settings.manage",
  z.object({
    id: z.string().max(40).optional(),
    code: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]{2,30}$/),
    name: z.string().trim().min(2).max(60),
    description: z.string().trim().max(120),
    carrier: z.string().trim().max(40),
    pricePence: zPence.refine((v) => v !== undefined, "Enter a price (0 for free)"),
    freeOverPence: zPence,
    estimatedMinDays: zInt(0, 60),
    estimatedMaxDays: zInt(0, 60),
    sortOrder: zInt(0, 100),
    isActive: zBool,
  }),
  async (d, actor) => {
    const data = {
      ...d,
      pricePence: d.pricePence!,
      freeOverPence: d.freeOverPence ?? null,
      estimatedMinDays: d.estimatedMinDays ?? 1,
      estimatedMaxDays: d.estimatedMaxDays ?? d.estimatedMinDays ?? 1,
      sortOrder: d.sortOrder ?? 0,
    };
    delete (data as { id?: string }).id;
    if (data.estimatedMaxDays < data.estimatedMinDays) throw new AdminError("Max days must be at least min days.");
    if (!data.isActive && d.id && !(await db.shippingMethod.count({ where: { isActive: true, id: { not: d.id } } })))
      throw new AdminError("At least one delivery method must stay active.");
    const m = d.id ? await db.shippingMethod.update({ where: { id: d.id }, data }) : await db.shippingMethod.create({ data });
    await audit(
      actor,
      "shipping.save",
      { type: "ShippingMethod", id: m.id },
      { summary: `${m.name} £${(m.pricePence / 100).toFixed(2)}`, after: data },
    );
    return ok(null, "Delivery method saved");
  },
  { tags: [TAGS.shipping, TAGS.settings] },
);
export async function saveShippingAction(fd: FormData) {
  return shipping(formToObject(fd));
}

const taxClass = adminAction(
  "settings.manage",
  z.object({
    id: z.string().max(40).optional(),
    name: z.string().trim().min(2).max(60),
    ratePercent: z.coerce.number().min(0).max(100),
    description: z.string().trim().max(200).optional(),
  }),
  async (d, actor) => {
    const data = { name: d.name, rateBps: Math.round(d.ratePercent * 100), description: d.description || null };
    const t = d.id ? await db.taxClass.update({ where: { id: d.id }, data }) : await db.taxClass.create({ data });
    await audit(actor, "tax.class.save", { type: "TaxClass", id: t.id }, { summary: `${t.name} ${t.rateBps / 100}%` });
    return ok(null, "Tax class saved");
  },
  { tags: [TAGS.products, TAGS.settings] },
);
export async function saveTaxClassAction(fd: FormData) {
  return taxClass(formToObject(fd));
}
