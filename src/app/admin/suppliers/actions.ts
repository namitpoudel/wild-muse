"use server";

import { z } from "zod";
import { fail, ok } from "@/app/actions/result";
import { zBool, zDate, zInt, zOptText, zPence } from "@/lib/zod-helpers";
import { adminAction, AdminError, formToObject } from "@/server/admin/action";
import { assertPermission } from "@/server/auth/session";
import { expire, TAGS } from "@/server/cache";
import { db } from "@/server/db";
import { audit } from "@/server/security/audit";
import { landedCosts } from "@/server/sourcing/landed-cost";
import { newKey, processDocument, processImage, putObject, UploadError } from "@/server/storage";

// ── Suppliers ──
const supplierSchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(2).max(120),
  type: z.enum(["MANUFACTURER", "ARTISAN", "WORKSHOP", "COOPERATIVE", "WHOLESALER"]),
  contactName: zOptText(100),
  email: z.union([z.email().max(254), z.literal("")]).transform((v) => v || null),
  phone: zOptText(40),
  whatsapp: zOptText(40),
  address: zOptText(300),
  district: zOptText(60),
  country: z.string().trim().min(2).max(60),
  currency: z.enum(["NPR", "GBP", "USD", "INR", "EUR"]),
  paymentTerms: zOptText(120),
  leadTimeDays: zInt(0, 365),
  certifications: zOptText(300),
  notes: zOptText(3000),
  isActive: zBool,
});
const saveSupplier = adminAction("sourcing.manage", supplierSchema, async (d, actor) => {
  const { id, ...data } = d;
  const s = id
    ? await db.supplier.update({ where: { id }, data: { ...data, leadTimeDays: data.leadTimeDays ?? null } })
    : await db.supplier.create({ data: { ...data, leadTimeDays: data.leadTimeDays ?? null } });
  await audit(actor, id ? "supplier.update" : "supplier.create", { type: "Supplier", id: s.id }, { summary: s.name });
  return ok({ id: s.id }, "Supplier saved");
});
export async function saveSupplierAction(fd: FormData) {
  return saveSupplier(formToObject(fd));
}

// ── Artisans (public profiles need consent) ──
const artisanSchema = z.object({
  id: z.string().max(40).optional(),
  supplierId: z.string().max(40),
  displayName: z.string().trim().min(2).max(80),
  craft: z.string().trim().min(2).max(80),
  region: zOptText(80),
  story: zOptText(2000),
  consentToPublish: zBool,
  consentDate: zDate,
});
const saveArtisan = adminAction("sourcing.manage", artisanSchema, async (d, actor) => {
  if (d.consentToPublish && !d.consentDate) throw new AdminError("Record the date written consent was given before publishing a profile.");
  const { id, ...data } = d;
  const a = id
    ? await db.artisan.update({ where: { id }, data: { ...data, consentDate: data.consentDate ?? null } })
    : await db.artisan.create({ data: { ...data, consentDate: data.consentDate ?? null } });
  await audit(actor, "artisan.save", { type: "Artisan", id: a.id }, { summary: `${a.displayName} (consent: ${a.consentToPublish})` });
  expire("artisans");
  return ok(null, "Artisan saved");
});
export async function saveArtisanAction(fd: FormData) {
  return saveArtisan(formToObject(fd));
}

export async function uploadArtisanPhotoAction(fd: FormData) {
  const actor = await assertPermission("sourcing.manage").catch(() => null);
  if (!actor) return fail("Not allowed.");
  const file = fd.get("file");
  if (!(file instanceof File) || !file.size) return fail("Choose a photo.");
  try {
    const img = await processImage(file, { maxEdge: 1600 });
    const stored = await putObject(newKey("artisans", img.ext), img.buffer, img.contentType, "public");
    await db.artisan.update({ where: { id: String(fd.get("id")) }, data: { photoUrl: stored.url } });
  } catch (e) {
    return fail(e instanceof UploadError ? e.message : "Upload failed.");
  }
  await audit(actor, "artisan.photo", { type: "Artisan", id: String(fd.get("id")) });
  return ok(null, "Photo uploaded");
}

/** Supplier invoices, packing lists, origin statements, C79s — stored PRIVATELY. */
export async function uploadDocumentAction(fd: FormData) {
  const actor = await assertPermission("sourcing.manage").catch(() => null);
  if (!actor) return fail("Not allowed.");
  const file = fd.get("file");
  const kind = String(fd.get("kind") ?? "Other").slice(0, 40);
  if (!(file instanceof File) || !file.size) return fail("Choose a file.");
  const link = {
    supplierId: (fd.get("supplierId") as string) || null,
    purchaseOrderId: (fd.get("purchaseOrderId") as string) || null,
    importShipmentId: (fd.get("importShipmentId") as string) || null,
  };
  try {
    const doc = await processDocument(file);
    const stored = await putObject(newKey("documents", doc.ext), doc.buffer, doc.contentType, "private");
    const row = await db.supplierDocument.create({
      data: { ...link, kind, fileName: file.name.replace(/[^\w.\- ]/g, "_").slice(0, 120), storageKey: stored.key },
    });
    await audit(actor, "document.upload", { type: "SupplierDocument", id: row.id }, { summary: `${kind}: ${row.fileName}` });
  } catch (e) {
    return fail(e instanceof UploadError ? e.message : "Upload failed.");
  }
  return ok(null, "Document uploaded");
}

// ── Purchase orders ──
const poSchema = z.object({
  id: z.string().max(40).optional(),
  supplierId: z.string().max(40),
  currency: z.enum(["NPR", "GBP", "USD", "INR", "EUR"]),
  rateToGbp: z.coerce.number().positive("Enter the exchange rate you paid").max(1000),
  orderedAt: zDate,
  expectedAt: zDate,
  supplierInvoiceRef: zOptText(60),
  notes: zOptText(2000),
  importShipmentId: zOptText(40),
  status: z.enum(["DRAFT", "SENT", "CONFIRMED", "IN_PRODUCTION", "SHIPPED", "CANCELLED"]).default("DRAFT"),
  items: z.preprocess(
    (v) => JSON.parse(String(v ?? "[]")),
    z
      .array(
        z.object({
          variantId: z.string().max(40),
          quantityOrdered: z.number().int().min(1).max(100000),
          unitCostMinor: z.number().int().min(0).max(1_000_000_000),
        }),
      )
      .max(300),
  ),
});
const savePO = adminAction("sourcing.manage", poSchema, async (d, actor) => {
  const existing = d.id ? await db.purchaseOrder.findUnique({ where: { id: d.id }, include: { items: true } }) : null;
  if (existing?.status === "RECEIVED") throw new AdminError("Received purchase orders are locked.");
  const header = {
    supplierId: d.supplierId,
    currency: d.currency,
    rateToGbp: d.rateToGbp.toFixed(6),
    orderedAt: d.orderedAt ?? null,
    expectedAt: d.expectedAt ?? null,
    supplierInvoiceRef: d.supplierInvoiceRef,
    notes: d.notes,
    importShipmentId: d.importShipmentId,
    status: d.status,
  };
  const po = await db.$transaction(async (tx) => {
    const p = existing
      ? await tx.purchaseOrder.update({ where: { id: existing.id }, data: header })
      : await tx.purchaseOrder.create({ data: header });
    if (!existing || existing.items.every((i) => i.quantityReceived === 0)) {
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: p.id } });
      if (d.items.length) await tx.purchaseOrderItem.createMany({ data: d.items.map((i) => ({ ...i, purchaseOrderId: p.id })) });
    }
    await audit(
      actor,
      existing ? "po.update" : "po.create",
      { type: "PurchaseOrder", id: p.id },
      { summary: `PO-${p.poNumber} ${d.items.length} lines, status ${d.status}` },
      tx,
    );
    return p;
  });
  return ok({ id: po.id }, "Purchase order saved");
});
export async function savePurchaseOrderAction(fd: FormData) {
  return savePO(formToObject(fd));
}

/** Receive goods: adds stock (ledger), then recalculates landed costs and product unit costs. */
const receive = adminAction(
  "sourcing.manage",
  z.object({
    id: z.string().max(40),
    received: z.preprocess((v) => JSON.parse(String(v ?? "{}")), z.record(z.string(), z.number().int().min(0).max(100000))),
  }),
  async ({ id, received }, actor) => {
    const po = await db.purchaseOrder.findUnique({
      where: { id },
      include: { items: true, importShipment: { include: { purchaseOrders: { include: { items: true } } } } },
    });
    if (!po) throw new AdminError("Purchase order not found.");
    if (po.status === "CANCELLED") throw new AdminError("This purchase order was cancelled.");
    const plan = po.items
      .map((item) => ({ item, qty: Math.min(received[item.id] ?? 0, item.quantityOrdered - item.quantityReceived) }))
      .filter((p) => p.qty > 0);
    const units = plan.reduce((n, p) => n + p.qty, 0);
    if (!units) throw new AdminError("Enter a quantity received for at least one line.");
    await db.$transaction(async (tx) => {
      for (const { item, qty } of plan) {
        await tx.purchaseOrderItem.update({ where: { id: item.id }, data: { quantityReceived: { increment: qty } } });
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stockOnHand: { increment: qty } } });
        await tx.stockMovement.create({
          data: { variantId: item.variantId, type: "RECEIVE", quantity: qty, purchaseOrderId: po.id, reason: `PO-${po.poNumber}`, userId: actor.id },
        });
      }
      const after = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: po.id } });
      if (after.every((i) => i.quantityReceived >= i.quantityOrdered))
        await tx.purchaseOrder.update({ where: { id: po.id }, data: { status: "RECEIVED", receivedAt: new Date() } });

      // Landed cost: allocate the linked shipment's costs across all POs travelling in it.
      const allItems = po.importShipment
        ? po.importShipment.purchaseOrders.flatMap((p) => p.items.map((i) => ({ ...i, rate: Number(p.rateToGbp) })))
        : po.items.map((i) => ({ ...i, rate: Number(po.rateToGbp) }));
      const lc = landedCosts(
        allItems.map((i) => ({ key: i.id, quantity: i.quantityOrdered, unitCostMinor: i.unitCostMinor, rateToGbp: i.rate })),
        po.importShipment,
      );
      for (const i of allItems)
        await tx.purchaseOrderItem.update({ where: { id: i.id }, data: { landedUnitCostPence: lc.lines[i.id].landedUnitPence } });
      const variants = await tx.productVariant.findMany({
        where: { id: { in: allItems.map((i) => i.variantId) } },
        select: { id: true, productId: true },
      });
      const byProduct = new Map<string, number[]>();
      for (const i of allItems) {
        const pid = variants.find((v) => v.id === i.variantId)?.productId;
        if (pid) byProduct.set(pid, [...(byProduct.get(pid) ?? []), lc.lines[i.id].landedUnitPence]);
      }
      for (const [pid, costs] of byProduct)
        await tx.product.update({ where: { id: pid }, data: { unitCostPence: Math.round(costs.reduce((a, b) => a + b, 0) / costs.length) } });
      await audit(actor, "po.receive", { type: "PurchaseOrder", id: po.id }, { summary: `PO-${po.poNumber}: received ${units} units` }, tx);
    });
    expire(TAGS.products);
    return ok(null, `Received ${units} units — stock and landed costs updated`);
  },
);
export async function receivePurchaseOrderAction(fd: FormData) {
  return receive(formToObject(fd));
}

// ── Import shipments ──
const shipmentSchema = z.object({
  id: z.string().max(40).optional(),
  reference: z.string().trim().min(2).max(60),
  forwarder: zOptText(80),
  trackingRef: zOptText(80),
  incoterms: zOptText(10),
  freightPence: zPence,
  dutyPence: zPence,
  importVatPence: zPence,
  brokerFeesPence: zPence,
  otherCostsPence: zPence,
  importVatReclaimable: zBool,
  dctsPreferenceClaimed: zBool,
  eoriUsed: zOptText(20),
  c79Reference: zOptText(40),
  shippedAt: zDate,
  arrivedAt: zDate,
  notes: zOptText(3000),
});
const saveShipment = adminAction("sourcing.manage", shipmentSchema, async (d, actor) => {
  const { id, ...rest } = d;
  const data = {
    ...rest,
    freightPence: rest.freightPence ?? 0,
    dutyPence: rest.dutyPence ?? 0,
    importVatPence: rest.importVatPence ?? 0,
    brokerFeesPence: rest.brokerFeesPence ?? 0,
    otherCostsPence: rest.otherCostsPence ?? 0,
    shippedAt: rest.shippedAt ?? null,
    arrivedAt: rest.arrivedAt ?? null,
  };
  const s = id ? await db.importShipment.update({ where: { id }, data }) : await db.importShipment.create({ data });
  await audit(actor, id ? "shipment.update" : "shipment.create", { type: "ImportShipment", id: s.id }, { summary: s.reference });
  return ok({ id: s.id }, "Import shipment saved");
});
export async function saveImportShipmentAction(fd: FormData) {
  return saveShipment(formToObject(fd));
}
