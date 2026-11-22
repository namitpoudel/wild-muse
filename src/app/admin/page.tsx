import Link from "next/link";
import { AlertTriangle, BarChart3, Plus, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getProducts } from "@/lib/catalog/queries";
import { formatPenceExact } from "@/lib/money";

export const metadata = { title: "Dashboard" };

/**
 * Admin dashboard layout. Every KPI is computed from real data: with no orders yet,
 * revenue figures are genuinely £0.00. Low-stock is computed from (demo) inventory.
 */
export default async function AdminDashboard() {
  const products = await getProducts();
  const lowStock = products
    .flatMap((p) => p.variants.map((v) => ({ p, v })))
    .filter(({ v }) => v.stock <= 2)
    .sort((a, b) => a.v.stock - b.v.stock)
    .slice(0, 8);
  const orders: { totalPence: number }[] = [];
  const revenue = orders.reduce((n, o) => n + o.totalPence, 0);
  const kpis = [
    { label: "Total sales", value: formatPenceExact(revenue) },
    { label: "Today's revenue", value: formatPenceExact(0) },
    { label: "This month", value: formatPenceExact(0) },
    { label: "Average order value", value: orders.length ? formatPenceExact(revenue / orders.length) : "—" },
    { label: "Total orders", value: "0" },
    { label: "Pending", value: "0" },
    { label: "Completed", value: "0" },
    { label: "Cancelled", value: "0" },
    { label: "Customers", value: "0" },
  ];
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <p className="rounded-[2px] border border-mustard/50 bg-mustard/10 px-4 py-3 text-sm">
        <strong>Design preview.</strong> Sign-in, role permissions and live data are connected in Stage 4. Products shown are the demo catalogue.
      </p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Dashboard</h1>
          <p className="text-sm text-bark">Your store at a glance</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/admin/orders" variant="outline" size="sm">
            View orders
          </ButtonLink>
          <ButtonLink href="/admin/products/new" size="sm">
            <Plus /> Add product
          </ButtonLink>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k, i) => (
          <li
            key={k.label}
            className={`rounded-[3px] border border-sand bg-white p-4 shadow-soft ${i === 0 ? "col-span-2 md:col-span-1 xl:row-span-2 xl:flex xl:flex-col xl:justify-center" : ""}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-bark">{k.label}</p>
            <p className={`mt-1.5 font-display tabular-nums ${i === 0 ? "text-4xl" : "text-2xl"}`}>{k.value}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-[3px] border border-sand bg-white shadow-soft xl:col-span-2" aria-labelledby="sales-chart">
          <h2 id="sales-chart" className="border-b border-sand px-5 py-4 font-display text-xl">
            Sales — last 30 days
          </h2>
          <EmptyState icon={BarChart3} title="No sales yet">
            Your revenue chart appears here as soon as the first paid order is confirmed by Stripe.
          </EmptyState>
        </section>
        <section className="rounded-[3px] border border-sand bg-white shadow-soft" aria-labelledby="best">
          <h2 id="best" className="border-b border-sand px-5 py-4 font-display text-xl">
            Best-selling products
          </h2>
          <EmptyState icon={ShoppingCart} title="Waiting for orders">
            Ranked by units sold from real orders.
          </EmptyState>
        </section>
      </div>

      <section className="rounded-[3px] border border-sand bg-white shadow-soft" aria-labelledby="low-stock">
        <div className="flex items-center justify-between border-b border-sand px-5 py-4">
          <h2 id="low-stock" className="flex items-center gap-2 font-display text-xl">
            <AlertTriangle className="size-5 text-warning" aria-hidden /> Low stock
          </h2>
          <Link href="/admin/inventory" className="text-sm font-semibold underline underline-offset-4">
            Manage inventory
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-sand text-left text-xs uppercase tracking-[0.1em] text-bark">
                <th scope="col" className="px-5 py-3 font-semibold">
                  Product
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  SKU
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Variant
                </th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  Available
                </th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map(({ p, v }) => (
                <tr key={v.id} className="border-b border-sand/70 last:border-0 hover:bg-cream/50">
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-bark">{v.sku}</td>
                  <td className="px-5 py-3">
                    {v.colour} / {v.size}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Badge tone={v.stock === 0 ? "danger" : "warning"}>{v.stock === 0 ? "Sold out" : `${v.stock} left`}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
