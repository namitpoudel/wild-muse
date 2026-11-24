import Link from "next/link";
import { AlertTriangle, BarChart3, Plus, ShoppingCart } from "lucide-react";
import { Suspense } from "react";
import { SalesChart } from "@/components/admin/sales-chart";
import { AdminHeader, AdminSkeleton, Card, Stat } from "@/components/admin/ui";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPenceExact } from "@/lib/money";
import { getDashboardStats } from "@/server/admin/stats";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";
import { formatOrderNumber } from "@/server/orders/format";

export const metadata = { title: "Dashboard" };

export default function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const user = await requirePermission("dashboard.view");
  const [s, demoCount, sp] = await Promise.all([getDashboardStats(), db.product.count({ where: { isDemo: true, deletedAt: null } }), searchParams]);
  return (
    <div className="space-y-8">
      {sp.denied && (
        <p className="rounded-[2px] border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
          Your role doesn&apos;t have access to that section.
        </p>
      )}
      {demoCount > 0 && (
        <p className="rounded-[2px] border border-mustard/50 bg-mustard/10 px-4 py-3 text-sm">
          <strong>{demoCount} demo products</strong> are in the catalogue. Replace them with your real products, then remove them in{" "}
          <Link href="/admin/products?demo=1" className="font-semibold underline">
            Products
          </Link>
          .
        </p>
      )}
      <AdminHeader
        title="Dashboard"
        description={`Welcome back, ${user.name.split(" ")[0]}.`}
        actions={
          <>
            <ButtonLink href="/admin/orders" variant="outline" size="sm">
              View orders
            </ButtonLink>
            <ButtonLink href="/admin/products/new" size="sm">
              <Plus /> Add product
            </ButtonLink>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <div className="col-span-2 md:col-span-1 xl:row-span-2 [&>div]:h-full">
          <Stat big label="Total sales" value={formatPenceExact(s.totalSalesPence)} hint="Paid orders, net of refunds" />
        </div>
        <Stat label="Today's revenue" value={formatPenceExact(s.todayPence)} />
        <Stat label="This month" value={formatPenceExact(s.monthPence)} />
        <Stat label="Average order" value={s.totalOrders ? formatPenceExact(s.aovPence) : "—"} />
        <Stat label="Total orders" value={s.totalOrders} />
        <Stat label="To dispatch" value={s.pending} hint="Paid / preparing" />
        <Stat label="Completed" value={s.completed} hint="Dispatched / delivered" />
        <Stat label="Cancelled" value={s.cancelled} />
        <Stat label="Customers" value={s.customers} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Revenue — last 30 days" className="xl:col-span-2">
          {s.days.some((d) => d.totalPence > 0) ? (
            <SalesChart days={s.days} />
          ) : (
            <EmptyState icon={BarChart3} title="No sales yet">
              Your revenue chart appears here as soon as the first paid order is confirmed by Stripe.
            </EmptyState>
          )}
        </Card>
        <Card title="Best-selling products">
          {s.best.length ? (
            <ol className="space-y-3 text-sm">
              {s.best.map((b, i) => (
                <li key={b.productId} className="flex items-center justify-between gap-3">
                  <Link href={`/admin/products/${b.productId}`} className="hover:underline">
                    {i + 1}. {b.name}
                  </Link>
                  <span className="whitespace-nowrap text-bark">{b.units} sold</span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon={ShoppingCart} title="Waiting for orders">
              Ranked by units sold in paid orders.
            </EmptyState>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          title={
            <span className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-warning" aria-hidden /> Low stock
            </span>
          }
          actions={
            <Link href="/admin/inventory?low=1" className="text-sm font-semibold underline">
              Manage
            </Link>
          }
        >
          {s.lowStock.length ? (
            <ul className="divide-y divide-sand text-sm">
              {s.lowStock.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/admin/products/${v.productId}`} className="hover:underline">
                    {v.name}{" "}
                    <span className="text-bark">
                      · {v.colour} / {v.size}
                    </span>
                  </Link>
                  <Badge tone={v.available === 0 ? "danger" : "warning"}>{v.available === 0 ? "Sold out" : `${v.available} left`}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-bark">All variants are above their low-stock threshold.</p>
          )}
        </Card>
        <Card
          title="Recent orders"
          actions={
            <Link href="/admin/orders" className="text-sm font-semibold underline">
              All orders
            </Link>
          }
        >
          {s.recent.length ? (
            <ul className="divide-y divide-sand text-sm">
              {s.recent.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                    {formatOrderNumber(o.orderNumber)}
                  </Link>
                  <span className="min-w-0 flex-1 truncate text-bark">{o.email}</span>
                  <OrderStatusBadge status={o.status} />
                  <span className="w-20 text-right font-semibold">{formatPenceExact(o.totalPence)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-bark">No orders yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
