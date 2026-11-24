import Link from "next/link";
import { Suspense } from "react";
import { ShipmentForm } from "./shipment-form";
import { AdminHeader, AdminSkeleton, Card, Table, Td } from "@/components/admin/ui";
import { formatPenceExact } from "@/lib/money";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";

export const metadata = { title: "Import shipments" };
const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function ShipmentsPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Shipments />
    </Suspense>
  );
}

async function Shipments() {
  await requirePermission("sourcing.view", "/admin/shipments");
  const rows = await db.importShipment.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { purchaseOrders: true } } } });
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Import shipments"
        description="Consignments from Nepal. Freight, duty, import VAT and broker fees are spread across the purchase orders in each shipment to give a true landed cost."
      />
      <Table head={["Reference", "Forwarder", "POs", "Costs", "DCTS", "Arrived"]}>
        {rows.map((s) => (
          <tr key={s.id}>
            <Td>
              <Link href={`/admin/shipments/${s.id}`} className="font-semibold hover:underline">
                {s.reference}
              </Link>
            </Td>
            <Td>{s.forwarder ?? "—"}</Td>
            <Td>{s._count.purchaseOrders}</Td>
            <Td>{formatPenceExact(s.freightPence + s.dutyPence + s.importVatPence + s.brokerFeesPence + s.otherCostsPence)}</Td>
            <Td>{s.dctsPreferenceClaimed ? "Claimed" : "—"}</Td>
            <Td>{s.arrivedAt ? date.format(s.arrivedAt) : "—"}</Td>
          </tr>
        ))}
      </Table>
      <Card title="Add an import shipment">
        <ShipmentForm />
      </Card>
    </div>
  );
}
