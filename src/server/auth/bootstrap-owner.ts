import "server-only";
import { db } from "../db";

/**
 * First-owner bootstrap without a command line: if OWNER_EMAIL is set and the shop has NO owner yet,
 * the account with that exact email becomes OWNER the first time it signs in with a VERIFIED email.
 * Verification proves control of the inbox, so someone who registers the address first can't use it.
 * Once any owner exists this does nothing, so it can't be used to take over a running shop.
 */
export async function maybePromoteFirstOwner(userId: string): Promise<boolean> {
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!ownerEmail) return false;
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true, role: true } });
  if (!user || !user.emailVerified || user.email.toLowerCase() !== ownerEmail || user.role === "OWNER") return false;
  if (await db.user.count({ where: { role: "OWNER" } })) return false;
  await db.user.update({ where: { id: userId }, data: { role: "OWNER" } });
  await db.auditLog
    .create({
      data: { actorId: userId, action: "staff.bootstrap-owner", entityType: "User", entityId: userId, summary: "First owner from OWNER_EMAIL" },
    })
    .catch(() => {});
  console.log("[auth] first owner account activated from OWNER_EMAIL");
  return true;
}
