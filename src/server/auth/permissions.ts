/**
 * Role-based access control. Permissions are defined in code (version-controlled and
 * reviewable) rather than editable rows, so a compromised admin account cannot grant
 * itself new powers. Owners/admins assign ROLES to people in Admin → Staff & roles.
 *
 *   OWNER    – everything, including staff management, settings and refunds
 *   ADMIN    – everything except changing the owner or other admins
 *   MANAGER  – catalogue, orders (incl. refunds), customers, content, sourcing, reports
 *   STAFF    – view/process orders and stock, moderate reviews
 *   CUSTOMER – no admin access
 */
import type { Role } from "@/generated/prisma/enums";

export const PERMISSIONS = [
  "dashboard.view",
  "orders.view",
  "orders.update",
  "orders.refund",
  "orders.export",
  "products.view",
  "products.write",
  "products.delete",
  "inventory.adjust",
  "customers.view",
  "customers.manage",
  "reviews.moderate",
  "discounts.manage",
  "content.manage",
  "settings.manage",
  "sourcing.view",
  "sourcing.manage",
  "staff.manage",
  "audit.view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const STAFF: Permission[] = [
  "dashboard.view",
  "orders.view",
  "orders.update",
  "products.view",
  "inventory.adjust",
  "reviews.moderate",
  "customers.view",
];
const MANAGER: Permission[] = [
  ...STAFF,
  "orders.refund",
  "orders.export",
  "products.write",
  "products.delete",
  "customers.manage",
  "discounts.manage",
  "content.manage",
  "sourcing.view",
  "sourcing.manage",
  "audit.view",
];
const ALL = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  CUSTOMER: [],
  STAFF,
  MANAGER,
  ADMIN: ALL,
  OWNER: ALL,
};

export const STAFF_ROLES: Role[] = ["STAFF", "MANAGER", "ADMIN", "OWNER"];

export function can(role: Role | undefined | null, permission: Permission) {
  return !!role && ROLE_PERMISSIONS[role].includes(permission);
}

export function isStaffRole(role: Role | undefined | null) {
  return !!role && STAFF_ROLES.includes(role);
}

/** Who may assign which roles. Only the owner can create admins or owners. */
export function canAssignRole(actor: Role, target: Role) {
  if (actor === "OWNER") return true;
  if (actor === "ADMIN") return target !== "OWNER" && target !== "ADMIN";
  return false;
}

export const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: "Customer",
  STAFF: "Staff",
  MANAGER: "Manager",
  ADMIN: "Administrator",
  OWNER: "Owner",
};
