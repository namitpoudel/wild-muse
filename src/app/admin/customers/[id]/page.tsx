import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { setCustomerStatusAction, setRoleAction } from "../actions";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { AdminForm, FSelect, Submit } from "@/components/admin/admin-form";
import { AdminHeader, AdminSkeleton, Card, Table, Td } from "@/components/admin/ui";
import { formatPenceExact } from "@/lib/money";
import { can, canAssignRole, ROLE_LABELS } from "@/server/auth/permissions";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";
import { formatOrderNumber } from "@/server/orders/format";

export const metadata = { title: "Customer" };
const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Customer params={params} />
    </Suspense>
  );
}

async function Customer({ params }: Pick<PageProps<"/admin/customers/[id]">, "params">) {
  const actor = await requirePermission("customers.view", "/admin/customers");
  const { id } = await params;
  const u = await db.user.findUnique({
    where: { id: id.slice(0, 40) },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
      addresses: true,
      _count: { select: { reviews: true, wishlist: true } },
      newsletter: { select: { status: true } },
    },
  });
  if (!u) notFound();
  const paid = u.orders.filter((o) => !["PENDING_PAYMENT", "CANCELLED"].includes(o.status));
  return (
    <div className="space-y-6">
      <AdminHeader
        title={u.name}
        back={{ href: "/admin/customers", label: "Customers" }}
        description={`${u.email} · joined ${date.format(u.createdAt)} · ${ROLE_LABELS[u.role]}`}
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title={`Order history (${paid.length})`}>
            {u.orders.length ? (
              <Table head={["Order", "Date", "Status", "Total"]}>
                {u.orders.map((o) => (
                  <tr key={o.id}>
                    <Td>
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                        {formatOrderNumber(o.orderNumber)}
                      </Link>
                    </Td>
                    <Td>{date.format(o.createdAt)}</Td>
                    <Td>
                      <OrderStatusBadge status={o.status} />
                    </Td>
                    <Td>{formatPenceExact(o.totalPence)}</Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <p className="text-sm text-bark">No orders yet.</p>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Summary">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Lifetime spend</dt>
                <dd>{formatPenceExact(paid.reduce((n, o) => n + o.totalPence, 0))}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Phone</dt>
                <dd>{u.phone ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Email verified</dt>
                <dd>{u.emailVerified ? "Yes" : "No"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Newsletter</dt>
                <dd>{u.newsletter?.status.toLowerCase() ?? "not subscribed"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Saved addresses</dt>
                <dd>{u.addresses.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Reviews / wishlist</dt>
                <dd>
                  {u._count.reviews} / {u._count.wishlist}
                </dd>
              </div>
            </dl>
          </Card>
          {can(actor.role, "customers.manage") && u.id !== actor.id && (
            <Card title="Account access">
              <AdminForm
                action={setCustomerStatusAction}
                confirm={u.status === "ACTIVE" ? "Suspend this account? They'll be signed out everywhere." : undefined}
              >
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="status" value={u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} />
                <p className="mb-3 text-sm">Status: {u.status.toLowerCase()}</p>
                <Submit variant={u.status === "ACTIVE" ? "danger" : "outline"}>
                  {u.status === "ACTIVE" ? "Suspend account" : "Reactivate account"}
                </Submit>
              </AdminForm>
            </Card>
          )}
          {can(actor.role, "staff.manage") && u.id !== actor.id && canAssignRole(actor.role, u.role) && (
            <Card title="Role & permissions">
              <AdminForm action={setRoleAction} confirm="Change this person's role?" className="space-y-3">
                <input type="hidden" name="id" value={u.id} />
                <FSelect
                  label="Role"
                  name="role"
                  defaultValue={u.role}
                  options={(["CUSTOMER", "STAFF", "MANAGER", "ADMIN", "OWNER"] as const)
                    .filter((r) => canAssignRole(actor.role, r))
                    .map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
                />
                <Submit variant="outline">Update role</Submit>
              </AdminForm>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
