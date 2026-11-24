import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader, AdminSkeleton, FilterBar, FilterField, inputCls, Pagination, qs, Table, Td } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import type { Prisma } from "@/generated/prisma/client";
import { formatPenceExact } from "@/lib/money";
import { ROLE_LABELS } from "@/server/auth/permissions";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";

export const metadata = { title: "Customers" };
const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Customers searchParams={searchParams} />
    </Suspense>
  );
}

async function Customers({ searchParams }: Pick<PageProps<"/admin/customers">, "searchParams">) {
  await requirePermission("customers.view", "/admin/customers");
  const sp = (await searchParams) as Record<string, string | undefined>;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.slice(0, 80);
  const where: Prisma.UserWhereInput = q
    ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] }
    : {};
  const take = 30;
  const [rows, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
      include: { orders: { where: { status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] } }, select: { totalPence: true } } },
    }),
    db.user.count({ where }),
  ]);
  return (
    <div>
      <AdminHeader title="Customers" description={`${total} account${total === 1 ? "" : "s"}. Guest orders appear under Orders.`} />
      <FilterBar action="/admin/customers">
        <FilterField label="Search">
          <input name="q" defaultValue={q} placeholder="Name or email" className={inputCls} />
        </FilterField>
      </FilterBar>
      <Table head={["Customer", "Joined", "Orders", "Spent", "Role", "Status"]}>
        {rows.map((u) => (
          <tr key={u.id} className="hover:bg-cream/40">
            <Td>
              <Link href={`/admin/customers/${u.id}`} className="font-semibold hover:underline">
                {u.name}
              </Link>
              <span className="block text-xs text-bark">{u.email}</span>
            </Td>
            <Td>{date.format(u.createdAt)}</Td>
            <Td>{u.orders.length}</Td>
            <Td>{formatPenceExact(u.orders.reduce((n, o) => n + o.totalPence, 0))}</Td>
            <Td>{ROLE_LABELS[u.role]}</Td>
            <Td>
              <Badge tone={u.status === "ACTIVE" ? "success" : "danger"}>{u.status.toLowerCase()}</Badge>
            </Td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / take))} href={(n) => `/admin/customers${qs(sp, { page: n })}`} />
    </div>
  );
}
