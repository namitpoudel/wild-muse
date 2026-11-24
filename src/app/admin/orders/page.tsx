import Link from "next/link";
import { Download } from "lucide-react";
import { Suspense } from "react";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { AdminHeader, AdminSkeleton, FilterBar, FilterField, inputCls, Pagination, qs, Table, Td } from "@/components/admin/ui";
import { formatPenceExact } from "@/lib/money";
import { listOrders } from "@/server/admin/orders";
import { can } from "@/server/auth/permissions";
import { requirePermission } from "@/server/auth/session";
import { formatOrderNumber, ORDER_STATUS_LABEL } from "@/server/orders/format";

export const metadata = { title: "Orders" };
const dt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  const user = await requirePermission("orders.view", "/admin/orders");
  const sp = (await searchParams) as Record<string, string | undefined>;
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total, pages } = await listOrders({ q: sp.q, status: sp.status, from: sp.from, to: sp.to, page });
  return (
    <div>
      <AdminHeader
        title="Orders"
        description={`${total} order${total === 1 ? "" : "s"}${sp.status ? "" : " (excluding unpaid checkouts)"}`}
        actions={
          can(user.role, "orders.export") && (
            <a
              href={`/api/admin/orders/export${qs(sp, { page: undefined })}`}
              className="inline-flex h-9 items-center gap-2 rounded-[2px] border border-chocolate/70 px-4 text-xs font-semibold uppercase tracking-[0.12em] hover:bg-chocolate hover:text-linen"
            >
              <Download className="size-4" aria-hidden /> Export CSV
            </a>
          )
        }
      />
      <FilterBar action="/admin/orders">
        <FilterField label="Search">
          <input name="q" defaultValue={sp.q} placeholder="WM-10001, email, name or SKU" className={inputCls} />
        </FilterField>
        <FilterField label="Status">
          <select name="status" defaultValue={sp.status ?? ""} className={inputCls}>
            <option value="">All placed orders</option>
            {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="From">
          <input type="date" name="from" defaultValue={sp.from} className={inputCls} />
        </FilterField>
        <FilterField label="To">
          <input type="date" name="to" defaultValue={sp.to} className={inputCls} />
        </FilterField>
      </FilterBar>
      <Table head={["Order", "Date", "Customer", "Items", "Status", "Total"]}>
        {rows.map((o) => {
          const ship = o.shippingAddress as { fullName?: string; postcode?: string };
          return (
            <tr key={o.id} className="hover:bg-cream/40">
              <Td>
                <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                  {formatOrderNumber(o.orderNumber)}
                </Link>
              </Td>
              <Td>{dt.format(o.placedAt ?? o.createdAt)}</Td>
              <Td>
                {ship.fullName}
                <span className="block text-xs text-bark">{o.email}</span>
              </Td>
              <Td>{o.items.reduce((n, i) => n + i.quantity, 0)}</Td>
              <Td>
                <OrderStatusBadge status={o.status} />
              </Td>
              <Td className="font-semibold">{formatPenceExact(o.totalPence)}</Td>
            </tr>
          );
        })}
      </Table>
      {!rows.length && <p className="p-6 text-center text-sm text-bark">No orders match these filters.</p>}
      <Pagination page={page} pages={pages} href={(n) => `/admin/orders${qs(sp, { page: n })}`} />
    </div>
  );
}
