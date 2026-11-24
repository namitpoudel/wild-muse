import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader, AdminSkeleton, Table, Td } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";

export const metadata = { title: "Purchase orders" };
const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function POsPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <POs />
    </Suspense>
  );
}

async function POs() {
  await requirePermission("sourcing.view", "/admin/purchase-orders");
  const rows = await db.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { supplier: { select: { name: true } }, items: true, importShipment: { select: { reference: true } } },
  });
  return (
    <div>
      <AdminHeader
        title="Purchase orders"
        description="Orders placed with your suppliers. Receiving a PO adds stock and updates landed costs."
        actions={
          <ButtonLink href="/admin/purchase-orders/new" size="sm">
            New purchase order
          </ButtonLink>
        }
      />
      <Table head={["PO", "Supplier", "Status", "Units", "Value", "Expected", "Shipment"]}>
        {rows.map((p) => {
          const units = p.items.reduce((n, i) => n + i.quantityOrdered, 0);
          const received = p.items.reduce((n, i) => n + i.quantityReceived, 0);
          const value = p.items.reduce((n, i) => n + i.quantityOrdered * i.unitCostMinor, 0) / 100;
          return (
            <tr key={p.id}>
              <Td>
                <Link href={`/admin/purchase-orders/${p.id}`} className="font-semibold hover:underline">
                  PO-{p.poNumber}
                </Link>
              </Td>
              <Td>{p.supplier.name}</Td>
              <Td>
                <Badge tone={p.status === "RECEIVED" ? "success" : p.status === "CANCELLED" ? "danger" : "neutral"}>
                  {p.status.toLowerCase().replace("_", " ")}
                </Badge>
              </Td>
              <Td>
                {received}/{units}
              </Td>
              <Td>
                {p.currency} {value.toLocaleString("en-GB", { maximumFractionDigits: 2 })}
              </Td>
              <Td>{p.expectedAt ? date.format(p.expectedAt) : "—"}</Td>
              <Td>{p.importShipment?.reference ?? "—"}</Td>
            </tr>
          );
        })}
      </Table>
      {!rows.length && <p className="p-6 text-center text-sm text-bark">No purchase orders yet.</p>}
    </div>
  );
}
