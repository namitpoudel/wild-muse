import { Suspense } from "react";
import { POEditor } from "@/components/admin/po-editor";
import { AdminHeader, AdminSkeleton } from "@/components/admin/ui";
import { variantOptions } from "@/server/admin/sourcing";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";

export const metadata = { title: "New purchase order" };

export default function NewPOPage({ searchParams }: PageProps<"/admin/purchase-orders/new">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <NewPO searchParams={searchParams} />
    </Suspense>
  );
}

async function NewPO({ searchParams }: Pick<PageProps<"/admin/purchase-orders/new">, "searchParams">) {
  await requirePermission("sourcing.manage", "/admin/purchase-orders");
  const sp = await searchParams;
  const [suppliers, variants, shipments] = await Promise.all([
    db.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, currency: true } }),
    variantOptions(),
    db.importShipment.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, reference: true } }),
  ]);
  if (!suppliers.length)
    return (
      <div>
        <AdminHeader title="New purchase order" back={{ href: "/admin/purchase-orders", label: "Purchase orders" }} />
        <p className="text-sm">Add a supplier first in Suppliers.</p>
      </div>
    );
  const supplier = suppliers.find((s) => s.id === sp.supplier) ?? suppliers[0];
  return (
    <div>
      <AdminHeader title="New purchase order" back={{ href: "/admin/purchase-orders", label: "Purchase orders" }} />
      <POEditor
        po={{
          supplierId: supplier.id,
          currency: supplier.currency,
          rateToGbp: "",
          orderedAt: new Date().toISOString().slice(0, 10),
          expectedAt: "",
          supplierInvoiceRef: "",
          notes: "",
          importShipmentId: "",
          status: "DRAFT",
          locked: false,
          lines: [],
        }}
        suppliers={suppliers}
        variants={variants}
        shipments={shipments}
      />
    </div>
  );
}
