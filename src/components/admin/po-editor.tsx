"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { receivePurchaseOrderAction, savePurchaseOrderAction } from "@/app/admin/suppliers/actions";
import { AdminForm, F, FArea, FSelect, Submit } from "./admin-form";

export interface VariantOption {
  id: string;
  label: string;
}
interface Line {
  variantId: string;
  quantityOrdered: number;
  unitCost: string;
}
export interface POEditorData {
  id?: string;
  supplierId: string;
  currency: string;
  rateToGbp: string;
  orderedAt: string;
  expectedAt: string;
  supplierInvoiceRef: string;
  notes: string;
  importShipmentId: string;
  status: string;
  locked: boolean;
  lines: Line[];
}

/** Purchase order editor. Unit costs are entered in the supplier's currency (e.g. NPR) and stored in minor units. */
export function POEditor({
  po,
  suppliers,
  variants,
  shipments,
}: {
  po: POEditorData;
  suppliers: { id: string; name: string; currency: string }[];
  variants: VariantOption[];
  shipments: { id: string; reference: string }[];
}) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(po.lines.length ? po.lines : [{ variantId: variants[0]?.id ?? "", quantityOrdered: 1, unitCost: "" }]);
  const items = JSON.stringify(
    lines
      .filter((l) => l.variantId)
      .map((l) => ({
        variantId: l.variantId,
        quantityOrdered: Math.max(1, Math.floor(l.quantityOrdered)),
        unitCostMinor: Math.round((Number(l.unitCost) || 0) * 100),
      })),
  );
  return (
    <AdminForm
      action={savePurchaseOrderAction}
      onSuccess={(d: unknown) => !po.id && router.push(`/admin/purchase-orders/${(d as { id: string }).id}`)}
      className="space-y-6"
    >
      {po.id && <input type="hidden" name="id" value={po.id} />}
      <input type="hidden" name="items" value={items} />
      <div className="grid gap-4 rounded-[3px] border border-sand bg-white p-5 shadow-soft md:grid-cols-3">
        <FSelect label="Supplier" name="supplierId" defaultValue={po.supplierId} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
        <FSelect
          label="Currency"
          name="currency"
          defaultValue={po.currency}
          options={["NPR", "GBP", "USD", "INR", "EUR"].map((c) => ({ value: c, label: c }))}
        />
        <F
          label="Rate: 1 unit = £"
          name="rateToGbp"
          defaultValue={po.rateToGbp}
          inputMode="decimal"
          hint="The rate you actually paid (e.g. 0.0058 for NPR)"
        />
        <F label="Ordered on" name="orderedAt" type="date" defaultValue={po.orderedAt} />
        <F label="Expected by" name="expectedAt" type="date" defaultValue={po.expectedAt} />
        <FSelect
          label="Status"
          name="status"
          defaultValue={po.status === "RECEIVED" ? "SHIPPED" : po.status}
          options={["DRAFT", "SENT", "CONFIRMED", "IN_PRODUCTION", "SHIPPED", "CANCELLED"].map((s) => ({
            value: s,
            label: s.replace("_", " ").toLowerCase(),
          }))}
        />
        <F label="Supplier invoice ref" name="supplierInvoiceRef" defaultValue={po.supplierInvoiceRef} />
        <FSelect
          label="Import shipment"
          name="importShipmentId"
          defaultValue={po.importShipmentId}
          options={[{ value: "", label: "Not yet shipped" }, ...shipments.map((s) => ({ value: s.id, label: s.reference }))]}
        />
        <FArea label="Notes" name="notes" defaultValue={po.notes} rows={2} className="md:col-span-3" />
      </div>
      <div className="rounded-[3px] border border-sand bg-white p-5 shadow-soft">
        <h2 className="mb-3 font-display text-xl">Lines</h2>
        {po.locked && <p className="mb-3 text-xs text-bark">Lines are locked once goods have been received.</p>}
        <ul className="space-y-2">
          {lines.map((l, i) => (
            <li key={i} className="grid grid-cols-[1fr_6rem_8rem_2.5rem] items-center gap-2">
              <select
                value={l.variantId}
                disabled={po.locked}
                onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, variantId: e.target.value } : x)))}
                className="h-10 rounded-[2px] border border-sand-deep px-2 text-sm"
                aria-label="Product variant"
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                disabled={po.locked}
                value={l.quantityOrdered}
                onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, quantityOrdered: Number(e.target.value) } : x)))}
                className="h-10 rounded-[2px] border border-sand-deep px-2 text-sm"
                aria-label="Quantity"
              />
              <input
                inputMode="decimal"
                disabled={po.locked}
                value={l.unitCost}
                placeholder="Unit cost"
                onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, unitCost: e.target.value } : x)))}
                className="h-10 rounded-[2px] border border-sand-deep px-2 text-sm"
                aria-label="Unit cost"
              />
              <button
                type="button"
                disabled={po.locked}
                onClick={() => setLines(lines.filter((_, j) => j !== i))}
                className="grid size-10 place-items-center text-bark hover:text-danger disabled:opacity-30"
                aria-label="Remove line"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        {!po.locked && (
          <button
            type="button"
            onClick={() => setLines([...lines, { variantId: variants[0]?.id ?? "", quantityOrdered: 1, unitCost: "" }])}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline"
          >
            <Plus className="size-4" /> Add line
          </button>
        )}
      </div>
      <Submit>Save purchase order</Submit>
    </AdminForm>
  );
}

export function ReceiveForm({ poId, lines }: { poId: string; lines: { id: string; label: string; ordered: number; received: number }[] }) {
  const [qty, setQty] = useState<Record<string, number>>(Object.fromEntries(lines.map((l) => [l.id, l.ordered - l.received])));
  return (
    <AdminForm action={receivePurchaseOrderAction} confirm="Add these quantities to stock?" className="space-y-3">
      <input type="hidden" name="id" value={poId} />
      <input type="hidden" name="received" value={JSON.stringify(qty)} />
      <ul className="space-y-2 text-sm">
        {lines.map((l) => (
          <li key={l.id} className="flex items-center justify-between gap-3">
            <span>
              {l.label}{" "}
              <span className="text-bark">
                ({l.received}/{l.ordered} received)
              </span>
            </span>
            <input
              type="number"
              min={0}
              max={l.ordered - l.received}
              value={qty[l.id]}
              onChange={(e) => setQty({ ...qty, [l.id]: Number(e.target.value) })}
              className="h-9 w-20 rounded-[2px] border border-sand-deep px-2"
              aria-label={`Quantity received for ${l.label}`}
            />
          </li>
        ))}
      </ul>
      <Submit variant="dark">Receive into stock</Submit>
    </AdminForm>
  );
}
