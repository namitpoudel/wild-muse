"use server";

import { z } from "zod";
import { ok } from "@/app/actions/result";
import { zInt } from "@/lib/zod-helpers";
import { adminAction, AdminError, formToObject } from "@/server/admin/action";
import { TAGS } from "@/server/cache";
import { db } from "@/server/db";
import { audit } from "@/server/security/audit";

const adjust = adminAction(
  "inventory.adjust",
  z.object({
    variantId: z.string().max(40),
    type: z.enum(["RECEIVE", "ADJUST", "DAMAGE", "RETURN"]),
    quantity: z.coerce
      .number()
      .int()
      .min(-100000)
      .max(100000)
      .refine((n) => n !== 0, "Enter a non-zero quantity"),
    reason: z.string().trim().min(3, "Give a reason (e.g. stock count, damaged)").max(200),
    lowStockThreshold: zInt(0, 1000),
  }),
  async (d, actor) => {
    // DAMAGE always removes stock; RECEIVE/RETURN always add.
    const delta = d.type === "DAMAGE" ? -Math.abs(d.quantity) : d.type === "ADJUST" ? d.quantity : Math.abs(d.quantity);
    await db.$transaction(async (tx) => {
      const n = await tx.$executeRaw`UPDATE "ProductVariant" SET "stockOnHand" = "stockOnHand" + ${delta}, "updatedAt" = now()
        WHERE id = ${d.variantId} AND "stockOnHand" + ${delta} >= "stockReserved"`;
      if (n !== 1) throw new AdminError("That would take stock below zero or below units reserved by open checkouts.");
      if (d.lowStockThreshold !== undefined)
        await tx.productVariant.update({ where: { id: d.variantId }, data: { lowStockThreshold: d.lowStockThreshold } });
      await tx.stockMovement.create({ data: { variantId: d.variantId, type: d.type, quantity: delta, reason: d.reason, userId: actor.id } });
      const v = await tx.productVariant.findUniqueOrThrow({ where: { id: d.variantId }, include: { product: { select: { name: true } } } });
      await audit(
        actor,
        "inventory.adjust",
        { type: "ProductVariant", id: d.variantId },
        { summary: `${v.product.name} ${v.colour}/${v.size}: ${delta > 0 ? "+" : ""}${delta} (${d.reason})` },
        tx,
      );
    });
    return ok(null, "Stock updated");
  },
  { tags: [TAGS.products] },
);
export async function adjustStockAction(fd: FormData) {
  return adjust(formToObject(fd));
}
