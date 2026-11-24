"use server";

import { z } from "zod";
import { ok } from "@/app/actions/result";
import { zBool, zDate, zInt, zOptText, zPence } from "@/lib/zod-helpers";
import { adminAction, AdminError, formToObject } from "@/server/admin/action";
import { db } from "@/server/db";
import { audit } from "@/server/security/audit";

const schema = z
  .object({
    id: z.string().max(40).optional(),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9-]{3,32}$/, "3–32 letters, numbers or hyphens"),
    description: zOptText(200),
    type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
    value: z.coerce.number().min(0).max(100000).default(0),
    minSubtotalPence: zPence,
    startsAt: zDate,
    endsAt: zDate,
    usageLimit: zInt(1, 1_000_000),
    perCustomerLimit: zInt(1, 1000),
    firstOrderOnly: zBool,
    isActive: zBool,
  })
  .superRefine((d, ctx) => {
    if (d.type === "PERCENT" && (d.value < 1 || d.value > 100))
      ctx.addIssue({ code: "custom", path: ["value"], message: "Percentage must be 1–100" });
    if (d.type === "FIXED" && d.value <= 0) ctx.addIssue({ code: "custom", path: ["value"], message: "Enter an amount in £" });
    if (d.startsAt && d.endsAt && d.endsAt <= d.startsAt) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End must be after start" });
  });

const save = adminAction("discounts.manage", schema, async (d, actor) => {
  const data = {
    code: d.code,
    description: d.description,
    type: d.type,
    // FIXED amounts are entered in pounds and stored in pence.
    value: d.type === "FIXED" ? Math.round(d.value * 100) : d.type === "PERCENT" ? Math.round(d.value) : 0,
    minSubtotalPence: d.minSubtotalPence ?? 0,
    startsAt: d.startsAt ?? null,
    endsAt: d.endsAt ?? null,
    usageLimit: d.usageLimit ?? null,
    perCustomerLimit: d.perCustomerLimit ?? null,
    firstOrderOnly: d.firstOrderOnly,
    isActive: d.isActive,
  };
  const c = d.id ? await db.coupon.update({ where: { id: d.id }, data }) : await db.coupon.create({ data });
  await audit(actor, d.id ? "coupon.update" : "coupon.create", { type: "Coupon", id: c.id }, { summary: c.code, after: data });
  return ok(null, `Code ${c.code} saved`);
});
export async function saveCouponAction(fd: FormData) {
  return save(formToObject(fd));
}

const remove = adminAction("discounts.manage", z.object({ id: z.string().max(40) }), async ({ id }, actor) => {
  const c = await db.coupon.findUnique({ where: { id }, include: { _count: { select: { redemptions: true } } } });
  if (!c) throw new AdminError("Not found.");
  if (c._count.redemptions) {
    await db.coupon.update({ where: { id }, data: { isActive: false } });
    await audit(actor, "coupon.deactivate", { type: "Coupon", id }, { summary: c.code });
    return ok(null, "Code has been used, so it was deactivated instead of deleted");
  }
  await db.coupon.delete({ where: { id } });
  await audit(actor, "coupon.delete", { type: "Coupon", id }, { summary: c.code });
  return ok(null, "Code deleted");
});
export async function deleteCouponAction(fd: FormData) {
  return remove(formToObject(fd));
}
