import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";
import { auth } from "./auth";
import { can, isStaffRole, type Permission } from "./permissions";

/**
 * Data Access Layer for identity. Every server action and protected page calls one
 * of these — never trust a role or user id sent from the browser.
 */
export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const u = session.user as typeof session.user & { role?: Role; status?: string };
  if (u.status === "SUSPENDED") return null;
  return { id: u.id, name: u.name, email: u.email, role: (u.role ?? "CUSTOMER") as Role, emailVerified: u.emailVerified };
}

/** For pages: redirect to sign-in when signed out. */
export async function requireUser(next = "/account"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/**
 * For admin pages: must be staff AND hold the permission.
 * Non-staff get a 404 (the admin area's existence isn't revealed); staff without the
 * specific permission are sent back to the dashboard with a notice.
 */
export async function requirePermission(permission: Permission, next = "/admin"): Promise<CurrentUser> {
  const user = await requireUser(next);
  if (!isStaffRole(user.role)) notFound();
  if (!can(user.role, permission)) redirect("/admin?denied=1");
  return user;
}

export class AuthError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "AuthError";
  }
}

/** For server actions: throws instead of redirecting. */
export async function assertPermission(permission: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Please sign in again.");
  if (!isStaffRole(user.role) || !can(user.role, permission)) throw new AuthError();
  return user;
}

export async function assertUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Please sign in to continue.");
  return user;
}
