import { notFound } from "next/navigation";
import { Suspense } from "react";
import { uploadDocumentAction } from "../../suppliers/actions";
import { AdminForm, FSelect, Submit } from "@/components/admin/admin-form";
import { POEditor, ReceiveForm } from "@/components/admin/po-editor";
import { AdminHeader, AdminSkeleton, Card } from "@/components/admin/ui";
import { formatPenceExact } from "@/lib/money";
import { isoDate, variantOptions } from "@/server/admin/sourcing";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";
import { marginPercent } from "@/server/sourcing/landed-cost";

export const metadata = { title: "Purchase order" };

export default function POPage({ params }: PageProps<"/admin/purchase-orders/[id]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <PO params={params} />
    </Suspense>
  );
}

async function PO({ params }: Pick<PageProps<"/admin/purchase-orders/[id]">, "params">) {
  await requirePermission("sourcing.manage", "/admin/purchase-orders");
  const { id } = await params;
  const po = await db.purchaseOrder.findUnique({
    where: { id: id.slice(0, 40) },
    include: { items: { include: { variant: { include: { product: { include: { taxClass: true } } } } } }, documents: true, supplier: true },
  });
  if (!po) notFound();
  const [suppliers, variants, shipments] = await Promise.all([
    db.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, currency: true } }),
    variantOptions(),
    db.importShipment.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, reference: true } }),
  ]);
  const locked = po.items.some((i) => i.quantityReceived > 0) || po.status === "RECEIVED";
  const label = (i: (typeof po.items)[number]) => `${i.variant.product.name} — ${i.variant.colour}/${i.variant.size}`;
  return (
    <div className="space-y-6">
      <AdminHeader
        title={`PO-${po.poNumber}`}
        back={{ href: "/admin/purchase-orders", label: "Purchase orders" }}
        description={`${po.supplier.name} · ${po.status.toLowerCase().replace("_", " ")}`}
      />
      <POEditor
        po={{
          id: po.id,
          supplierId: po.supplierId,
          currency: po.currency,
          rateToGbp: po.rateToGbp.toString(),
          orderedAt: isoDate(po.orderedAt),
          expectedAt: isoDate(po.expectedAt),
          supplierInvoiceRef: po.supplierInvoiceRef ?? "",
          notes: po.notes ?? "",
          importShipmentId: po.importShipmentId ?? "",
          status: po.status,
          locked,
          lines: po.items.map((i) => ({ variantId: i.variantId, quantityOrdered: i.quantityOrdered, unitCost: (i.unitCostMinor / 100).toString() })),
        }}
        suppliers={suppliers}
        variants={variants}
        shipments={shipments}
      />
      {po.status !== "CANCELLED" && po.status !== "RECEIVED" && po.items.length > 0 && (
        <Card title="Receive goods">
          <ReceiveForm
            poId={po.id}
            lines={po.items.map((i) => ({ id: i.id, label: label(i), ordered: i.quantityOrdered, received: i.quantityReceived }))}
          />
        </Card>
      )}
      <Card title="Landed cost & margin">
        <p className="mb-3 text-xs text-bark">
          Calculated when goods are received, including this PO&apos;s share of the linked import shipment&apos;s freight, duty and fees.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand text-left text-xs uppercase tracking-[0.1em] text-bark">
              <th className="py-2">Line</th>
              <th className="py-2 text-right">Landed unit cost</th>
              <th className="py-2 text-right">Retail</th>
              <th className="py-2 text-right">Gross margin</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((i) => {
              const retail = i.variant.pricePence ?? i.variant.product.pricePence;
              return (
                <tr key={i.id} className="border-b border-sand/60">
                  <td className="py-2">{label(i)}</td>
                  <td className="py-2 text-right">{i.landedUnitCostPence !== null ? formatPenceExact(i.landedUnitCostPence) : "—"}</td>
                  <td className="py-2 text-right">{formatPenceExact(retail)}</td>
                  <td className="py-2 text-right">
                    {i.landedUnitCostPence !== null
                      ? `${marginPercent(retail, i.landedUnitCostPence, i.variant.product.taxClass?.rateBps ?? 2000)}%`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-bark">
          Margin shown on the ex-VAT price at the product&apos;s tax rate (whether or not you are VAT registered yet).
        </p>
      </Card>
      <Card title="Documents">
        <ul className="mb-4 space-y-1 text-sm">
          {po.documents.map((d) => (
            <li key={d.id}>
              <a href={`/api/admin/documents/${d.id}`} target="_blank" className="underline">
                {d.fileName}
              </a>{" "}
              <span className="text-bark">· {d.kind}</span>
            </li>
          ))}
        </ul>
        <AdminForm action={uploadDocumentAction} resetOnSuccess className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="purchaseOrderId" value={po.id} />
          <input type="hidden" name="supplierId" value={po.supplierId} />
          <FSelect
            label="Type"
            name="kind"
            options={["Supplier invoice", "Packing list", "Origin statement (DCTS)", "Other"].map((k) => ({ value: k, label: k }))}
          />
          <input type="file" name="file" accept="application/pdf,image/jpeg,image/png" className="text-sm" />
          <Submit variant="dark">Upload</Submit>
        </AdminForm>
      </Card>
    </div>
  );
}
