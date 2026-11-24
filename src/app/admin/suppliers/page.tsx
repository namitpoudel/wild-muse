import Link from "next/link";
import { Suspense } from "react";
import { SupplierForm } from "./supplier-form";
import { AdminHeader, AdminSkeleton, Card, Table, Td } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";

export const metadata = { title: "Suppliers" };

export default function SuppliersPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Suppliers />
    </Suspense>
  );
}

async function Suppliers() {
  await requirePermission("sourcing.view", "/admin/suppliers");
  const rows = await db.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true, purchaseOrders: true, artisans: true } } },
  });
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Suppliers"
        description="Your manufacturers, workshops and artisans in Nepal."
        actions={
          <>
            <ButtonLink href="/admin/purchase-orders" variant="outline" size="sm">
              Purchase orders
            </ButtonLink>
            <ButtonLink href="/admin/shipments" variant="outline" size="sm">
              Import shipments
            </ButtonLink>
          </>
        }
      />
      <Table head={["Supplier", "Type", "Location", "Lead time", "Products", "POs", ""]}>
        {rows.map((s) => (
          <tr key={s.id}>
            <Td>
              <Link href={`/admin/suppliers/${s.id}`} className="font-semibold hover:underline">
                {s.name}
              </Link>
              <span className="block text-xs text-bark">{s.contactName ?? s.email ?? ""}</span>
            </Td>
            <Td>{s.type.toLowerCase()}</Td>
            <Td>{[s.district, s.country].filter(Boolean).join(", ")}</Td>
            <Td>{s.leadTimeDays ? `${s.leadTimeDays} days` : "—"}</Td>
            <Td>{s._count.products}</Td>
            <Td>{s._count.purchaseOrders}</Td>
            <Td>{!s.isActive && <Badge tone="neutral">inactive</Badge>}</Td>
          </tr>
        ))}
      </Table>
      {!rows.length && <p className="text-sm text-bark">No suppliers yet — add your first below.</p>}
      <Card title="Add a supplier">
        <SupplierForm />
      </Card>
    </div>
  );
}
