import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { uploadDocumentAction } from "../../suppliers/actions";
import { ShipmentForm } from "../shipment-form";
import { AdminForm, FSelect, Submit } from "@/components/admin/admin-form";
import { AdminHeader, AdminSkeleton, Card } from "@/components/admin/ui";
import { formatPenceExact } from "@/lib/money";
import { isoDate, pounds } from "@/server/admin/sourcing";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";
import { landedCosts } from "@/server/sourcing/landed-cost";

export const metadata = { title: "Import shipment" };

export default function ShipmentPage({ params }: PageProps<"/admin/shipments/[id]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Shipment params={params} />
    </Suspense>
  );
}

async function Shipment({ params }: Pick<PageProps<"/admin/shipments/[id]">, "params">) {
  await requirePermission("sourcing.manage", "/admin/shipments");
  const { id } = await params;
  const s = await db.importShipment.findUnique({
    where: { id: id.slice(0, 40) },
    include: {
      purchaseOrders: {
        include: { supplier: { select: { name: true } }, items: { include: { variant: { include: { product: { select: { name: true } } } } } } },
      },
      documents: true,
    },
  });
  if (!s) notFound();
  const items = s.purchaseOrders.flatMap((p) => p.items.map((i) => ({ ...i, rate: Number(p.rateToGbp), po: p.poNumber })));
  const lc = landedCosts(
    items.map((i) => ({ key: i.id, quantity: i.quantityOrdered, unitCostMinor: i.unitCostMinor, rateToGbp: i.rate })),
    s,
  );
  return (
    <div className="space-y-6">
      <AdminHeader title={s.reference} back={{ href: "/admin/shipments", label: "Import shipments" }} />
      <Card title="Shipment & costs">
        <ShipmentForm
          s={{
            id: s.id,
            reference: s.reference,
            forwarder: s.forwarder ?? "",
            trackingRef: s.trackingRef ?? "",
            incoterms: s.incoterms ?? "",
            freight: pounds(s.freightPence),
            duty: pounds(s.dutyPence),
            importVat: pounds(s.importVatPence),
            broker: pounds(s.brokerFeesPence),
            other: pounds(s.otherCostsPence),
            importVatReclaimable: s.importVatReclaimable,
            dctsPreferenceClaimed: s.dctsPreferenceClaimed,
            eoriUsed: s.eoriUsed ?? "",
            c79Reference: s.c79Reference ?? "",
            shippedAt: isoDate(s.shippedAt),
            arrivedAt: isoDate(s.arrivedAt),
            notes: s.notes ?? "",
          }}
        />
      </Card>
      <Card title="Landed cost allocation">
        <p className="mb-3 text-sm text-bark">
          Goods {formatPenceExact(lc.totalGoodsPence)} + overheads {formatPenceExact(lc.totalOverheadPence)}. Link purchase orders to this shipment
          from the PO page.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand text-left text-xs uppercase tracking-[0.1em] text-bark">
              <th className="py-2">PO / line</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Goods</th>
              <th className="py-2 text-right">Overheads</th>
              <th className="py-2 text-right">Landed unit</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-sand/60">
                <td className="py-2">
                  <Link href={`/admin/purchase-orders/${i.purchaseOrderId}`} className="underline">
                    PO-{i.po}
                  </Link>{" "}
                  {i.variant.product.name} — {i.variant.colour}/{i.variant.size}
                </td>
                <td className="py-2 text-right">{i.quantityOrdered}</td>
                <td className="py-2 text-right">{formatPenceExact(lc.lines[i.id].goodsPence)}</td>
                <td className="py-2 text-right">{formatPenceExact(lc.lines[i.id].overheadPence)}</td>
                <td className="py-2 text-right font-semibold">{formatPenceExact(lc.lines[i.id].landedUnitPence)}</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={5} className="py-3 text-bark">
                  No purchase orders linked yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      <Card title="Customs documents">
        <ul className="mb-4 space-y-1 text-sm">
          {s.documents.map((d) => (
            <li key={d.id}>
              <a href={`/api/admin/documents/${d.id}`} target="_blank" className="underline">
                {d.fileName}
              </a>{" "}
              <span className="text-bark">· {d.kind}</span>
            </li>
          ))}
        </ul>
        <AdminForm action={uploadDocumentAction} resetOnSuccess className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="importShipmentId" value={s.id} />
          <FSelect
            label="Type"
            name="kind"
            options={[
              "Customs declaration",
              "C79 import VAT certificate",
              "Origin statement (DCTS)",
              "Commercial invoice",
              "Air waybill",
              "Other",
            ].map((k) => ({ value: k, label: k }))}
          />
          <input type="file" name="file" accept="application/pdf,image/jpeg,image/png" className="text-sm" />
          <Submit variant="dark">Upload</Submit>
        </AdminForm>
      </Card>
    </div>
  );
}
