/**
 * Promote an existing account to a staff role.
 *
 *   1. Register normally on the website (/register) with the owner's email.
 *   2. npm run admin:create -- owner@yourdomain.co.uk            (defaults to OWNER)
 *      npm run admin:create -- manager@yourdomain.co.uk MANAGER
 *
 * Creating the first owner deliberately requires server/database access, so nobody
 * can grant themselves admin rights through the website.
 */
import { scriptClient } from "../prisma/client";

const ROLES = ["STAFF", "MANAGER", "ADMIN", "OWNER", "CUSTOMER"] as const;
type Role = (typeof ROLES)[number];

async function main() {
  const [email, roleArg = "OWNER"] = process.argv.slice(2);
  const role = roleArg.toUpperCase() as Role;
  if (!email || !ROLES.includes(role)) {
    console.error("Usage: npm run admin:create -- <email> [STAFF|MANAGER|ADMIN|OWNER|CUSTOMER]");
    process.exit(1);
  }
  const db = scriptClient();
  try {
    const user = await db.user.findFirst({ where: { email: { equals: email.trim(), mode: "insensitive" } } });
    if (!user) {
      console.error(`No account found for ${email}. Register at /register first, then run this again.`);
      process.exit(1);
    }
    await db.user.update({ where: { id: user.id }, data: { role } });
    await db.auditLog.create({ data: { action: "staff.role.set", entityType: "User", entityId: user.id, summary: `Role set to ${role} via CLI`, actorEmail: "cli" } });
    console.log(`✔ ${user.email} is now ${role}.`);
  } finally {
    await db.$disconnect();
  }
}

main();
