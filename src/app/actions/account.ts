"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { ukAddressSchema } from "@/lib/validation";
import { auth } from "@/server/auth/auth";
import { assertUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { fail, ok, zodFieldErrors, type ActionResult } from "./result";

const addressInput = ukAddressSchema.extend({ id: z.string().max(40).optional(), isDefault: z.boolean().default(false) });

export async function saveAddressAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await assertUser().catch(() => null);
  if (!user) return fail("Please sign in again.");
  const parsed = addressInput.safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", zodFieldErrors(parsed.error.issues));
  const { id, isDefault, country: _country, ...data } = parsed.data;
  void _country;
  if (await db.address.count({ where: { userId: user.id } }).then((n) => n >= 20 && !id)) return fail("You can save up to 20 addresses.");
  const saved = await db.$transaction(async (tx) => {
    if (isDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    if (id) {
      const owned = await tx.address.findFirst({ where: { id, userId: user.id } });
      if (!owned) throw new Error("not found");
      return tx.address.update({ where: { id }, data: { ...data, isDefault } });
    }
    const first = (await tx.address.count({ where: { userId: user.id } })) === 0;
    return tx.address.create({ data: { ...data, userId: user.id, isDefault: isDefault || first } });
  });
  return ok({ id: saved.id }, "Address saved");
}

export async function deleteAddressAction(id: string): Promise<ActionResult<null>> {
  const user = await assertUser().catch(() => null);
  if (!user) return fail("Please sign in again.");
  await db.address.deleteMany({ where: { id: String(id).slice(0, 40), userId: user.id } });
  return ok(null, "Address removed");
}

export async function updateProfileAction(input: { name: string; phone?: string }): Promise<ActionResult<null>> {
  const user = await assertUser().catch(() => null);
  if (!user) return fail("Please sign in again.");
  const parsed = z
    .object({
      name: z.string().trim().min(1, "Enter your name").max(100),
      phone: z
        .string()
        .trim()
        .max(30)
        .regex(/^[0-9+()\s-]*$/, "Enter a valid phone number")
        .optional(),
    })
    .safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", zodFieldErrors(parsed.error.issues));
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name, phone: parsed.data.phone || null } });
  return ok(null, "Details updated");
}

/**
 * Right to erasure. Deletes the account and personal data we don't need to keep.
 * Order records are retained (6 years, HMRC) but detached from the account; reviews are
 * anonymised. Requires the current password as confirmation.
 */
export async function deleteAccountAction(input: { password: string; confirm: string }): Promise<ActionResult<null>> {
  const user = await assertUser().catch(() => null);
  if (!user) return fail("Please sign in again.");
  if (input.confirm !== "DELETE") return fail("Type DELETE to confirm.");
  if (user.role !== "CUSTOMER") return fail("Staff accounts must be removed by the owner in Admin → Staff.");
  // Verify the password (Better Auth checks the hash).
  const check = await auth.api
    .verifyPassword({ body: { password: String(input.password ?? "").slice(0, 128) }, headers: await headers() })
    .catch(() => null);
  if (!check) return fail("That password isn't correct.");
  await db.$transaction(async (tx) => {
    await tx.review.updateMany({ where: { userId: user.id }, data: { userId: null, authorName: "Former customer" } });
    await tx.order.updateMany({ where: { userId: user.id }, data: { userId: null } });
    await tx.newsletterSubscriber.deleteMany({ where: { email: user.email } });
    await tx.auditLog.create({
      data: { action: "account.deleted", entityType: "User", entityId: user.id, summary: "Customer deleted their account", actorEmail: "customer" },
    });
    await tx.user.delete({ where: { id: user.id } }); // cascades: sessions, accounts, addresses, cart, wishlist
  });
  return ok(null, "Your account has been deleted.");
}
