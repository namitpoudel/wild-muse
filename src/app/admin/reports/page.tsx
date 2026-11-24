import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader, AdminSkeleton, Card, Table, Td } from "@/components/admin/ui";
import { formatPenceExact } from "@/lib/money";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";
import { marginPercent } from "@/server/sourcing/landed-cost";

export const metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Reports />
    </Suspense>
  );
}

async function Reports() {
  await requirePermission("dashboard.view", "/admin/reports");
  const [monthly, products] = await Promise.all([
    db.$queryRaw<{ month: Date; orders: bigint; revenue: bigint; discount: bigint; shipping: bigint; vat: bigint }[]>`
      SELECT date_trunc('month', "placedAt") AS month, COUNT(*)::bigint AS orders, SUM("totalPence")::bigint AS revenue,
             SUM("discountPence")::bigint AS discount, SUM("shippingPence")::bigint AS shipping, SUM("taxPence")::bigint AS vat
      FROM "Order" WHERE "placedAt" IS NOT NULL AND status::text NOT IN ('PENDING_PAYMENT','CANCELLED')
      GROUP BY 1 ORDER BY 1 DESC LIMIT 24`,
    db.product.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, include: { taxClass: true } }),
  ]);
  const fmtMonth = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Reports"
        description="Monthly sales (for your bookkeeping) and product margins. Export full order data from Orders → Export CSV."
      />
      <Card title="Sales by month">
        {monthly.length ? (
          <Table head={["Month", "Orders", "Revenue", "Discounts", "Delivery charged", "VAT included"]}>
            {monthly.map((m) => (
              <tr key={String(m.month)}>
                <Td>{fmtMonth.format(new Date(m.month))}</Td>
                <Td>{Number(m.orders)}</Td>
                <Td className="font-semibold">{formatPenceExact(Number(m.revenue))}</Td>
                <Td>{formatPenceExact(Number(m.discount))}</Td>
                <Td>{formatPenceExact(Number(m.shipping))}</Td>
                <Td>{formatPenceExact(Number(m.vat))}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-sm text-bark">No sales yet.</p>
        )}
      </Card>
      <Card title="Product margins">
        <p className="mb-3 text-xs text-bark">
          Based on the landed unit cost (set on the product or calculated when purchase orders are received). Margin is on the ex-VAT price.
        </p>
        <Table head={["Product", "Price", "Landed cost", "Gross margin"]}>
          {products.map((p) => (
            <tr key={p.id}>
              <Td>
                <Link href={`/admin/products/${p.id}`} className="hover:underline">
                  {p.name}
                </Link>
              </Td>
              <Td>{formatPenceExact(p.pricePence)}</Td>
              <Td>{p.unitCostPence ? formatPenceExact(p.unitCostPence) : <span className="text-bark">not set</span>}</Td>
              <Td>{p.unitCostPence ? `${marginPercent(p.pricePence, p.unitCostPence, p.taxClass?.rateBps ?? 2000)}%` : "—"}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
