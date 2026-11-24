"use server";

import { z } from "zod";
import { ok } from "@/app/actions/result";
import { adminAction, AdminError, formToObject } from "@/server/admin/action";
import { canAssignRole } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { audit } from "@/server/security/audit";

const ROLES = ["CUSTOMER", "STAFF", "MANAGER", "ADMIN", "OWNER"] as const;

const status = adminAction(
  "customers.manage",
  z.object({ id: z.string().max(40), status: z.enum(["ACTIVE", "SUSPENDED"]) }),
  async ({ id, status }, actor) => {
    if (id === actor.id) throw new AdminError("You can't suspend your own account.");
    const u = await db.user.findUnique({ where: { id } });
    if (!u) throw new AdminError("Account not found.");
    if (u.role !== "CUSTOMER" && actor.role !== "OWNER") throw new AdminError("Only the owner can suspend staff accounts.");
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { status } });
      if (status === "SUSPENDED") await tx.session.deleteMany({ where: { userId: id } }); // sign them out everywhere
      await audit(actor, `customer.${status.toLowerCase()}`, { type: "User", id }, { summary: u.email }, tx);
    });
    return ok(null, status === "SUSPENDED" ? "Account suspended and signed out" : "Account reactivated");
  },
);
export async function setCustomerStatusAction(fd: FormData) {
  return status(formToObject(fd));
}

/** Assign a staff role. Only owners/admins (staff.manage); admins cannot create admins/owners. */
const role = adminAction(
  "staff.manage",
  z.object({ email: z.email().max(254).optional(), id: z.string().max(40).optional(), role: z.enum(ROLES) }),
  async (d, actor) => {
    const u = d.id
      ? await db.user.findUnique({ where: { id: d.id } })
      : await db.user.findFirst({ where: { email: { equals: d.email ?? "", mode: "insensitive" } } });
    if (!u) throw new AdminError("No account with that email. Ask them to register on the website first.");
    if (u.id === actor.id) throw new AdminError("You can't change your own role.");
    if (!canAssignRole(actor.role, d.role) || !canAssignRole(actor.role, u.role)) throw new AdminError("Your role can't make that change.");
    if (u.role === "OWNER" && d.role !== "OWNER" && (await db.user.count({ where: { role: "OWNER" } })) <= 1)
      throw new AdminError("There must always be at least one owner.");
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: u.id }, data: { role: d.role } });
      await tx.session.deleteMany({ where: { userId: u.id } }); // new permissions apply on next sign-in
      await audit(
        actor,
        "staff.role.set",
        { type: "User", id: u.id },
        { summary: `${u.email}: ${u.role} → ${d.role}`, before: { role: u.role }, after: { role: d.role } },
        tx,
      );
    });
    return ok(null, `${u.email} is now ${d.role.toLowerCase()}`);
  },
);
export async function setRoleAction(fd: FormData) {
  return role(formToObject(fd));
}
