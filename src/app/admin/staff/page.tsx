import Link from "next/link";
import { Suspense } from "react";
import { setRoleAction } from "../customers/actions";
import { AdminForm, F, FSelect, Submit } from "@/components/admin/admin-form";
import { AdminHeader, AdminSkeleton, Card, Table, Td } from "@/components/admin/ui";
import { canAssignRole, PERMISSIONS, ROLE_LABELS, ROLE_PERMISSIONS, STAFF_ROLES } from "@/server/auth/permissions";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";

export const metadata = { title: "Staff & roles" };

export default function StaffPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Staff />
    </Suspense>
  );
}

async function Staff() {
  const actor = await requirePermission("staff.manage", "/admin/staff");
  const staff = await db.user.findMany({ where: { role: { in: STAFF_ROLES } }, orderBy: [{ role: "desc" }, { name: "asc" }] });
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Staff & roles"
        description="Give team members access by assigning a role. They must first register an account on the website."
      />
      <Table head={["Name", "Email", "Role", ""]}>
        {staff.map((u) => (
          <tr key={u.id}>
            <Td className="font-semibold">{u.name}</Td>
            <Td>{u.email}</Td>
            <Td>{ROLE_LABELS[u.role]}</Td>
            <Td>
              {u.id !== actor.id && canAssignRole(actor.role, u.role) && (
                <Link href={`/admin/customers/${u.id}`} className="text-sm underline">
                  Change
                </Link>
              )}
            </Td>
          </tr>
        ))}
      </Table>
      <Card title="Add a team member">
        <AdminForm action={setRoleAction} resetOnSuccess className="flex flex-wrap items-end gap-3">
          <F label="Their account email" name="email" type="email" className="min-w-72" />
          <FSelect
            label="Role"
            name="role"
            options={(["STAFF", "MANAGER", "ADMIN", "OWNER"] as const)
              .filter((r) => canAssignRole(actor.role, r))
              .map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          />
          <Submit>Grant access</Submit>
        </AdminForm>
      </Card>
      <Card title="What each role can do">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-xs">
            <thead>
              <tr className="border-b border-sand text-left">
                <th className="py-2">Permission</th>
                {STAFF_ROLES.map((r) => (
                  <th key={r} className="py-2 text-center">
                    {ROLE_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p} className="border-b border-sand/60">
                  <td className="py-1.5 font-mono">{p}</td>
                  {STAFF_ROLES.map((r) => (
                    <td key={r} className="text-center">
                      {ROLE_PERMISSIONS[r].includes(p) ? "✓" : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
