"use client";

import { useRouter } from "next/navigation";
import { saveImportShipmentAction } from "../suppliers/actions";
import { AdminForm, F, FArea, Submit } from "@/components/admin/admin-form";

export interface ShipmentData {
  id: string;
  reference: string;
  forwarder: string;
  trackingRef: string;
  incoterms: string;
  freight: string;
  duty: string;
  importVat: string;
  broker: string;
  other: string;
  importVatReclaimable: boolean;
  dctsPreferenceClaimed: boolean;
  eoriUsed: string;
  c79Reference: string;
  shippedAt: string;
  arrivedAt: string;
  notes: string;
}

export function ShipmentForm({ s }: { s?: ShipmentData }) {
  const router = useRouter();
  return (
    <AdminForm
      action={saveImportShipmentAction}
      onSuccess={(d: unknown) => !s && router.push(`/admin/shipments/${(d as { id: string }).id}`)}
      className="grid gap-3 md:grid-cols-4"
    >
      {s && <input type="hidden" name="id" value={s.id} />}
      <F label="Reference" name="reference" defaultValue={s?.reference} placeholder="e.g. KTM-2026-03" />
      <F label="Forwarder / courier" name="forwarder" defaultValue={s?.forwarder} />
      <F label="Air waybill / tracking" name="trackingRef" defaultValue={s?.trackingRef} />
      <F label="Incoterms" name="incoterms" defaultValue={s?.incoterms} placeholder="e.g. DAP" />
      <F label="Freight (£)" name="freightPence" inputMode="decimal" defaultValue={s?.freight} />
      <F label="Customs duty (£)" name="dutyPence" inputMode="decimal" defaultValue={s?.duty} />
      <F label="Import VAT (£)" name="importVatPence" inputMode="decimal" defaultValue={s?.importVat} />
      <F label="Broker / clearance fees (£)" name="brokerFeesPence" inputMode="decimal" defaultValue={s?.broker} />
      <F label="Other costs (£)" name="otherCostsPence" inputMode="decimal" defaultValue={s?.other} />
      <F label="EORI used" name="eoriUsed" defaultValue={s?.eoriUsed} placeholder="GB…" />
      <F label="C79 reference" name="c79Reference" defaultValue={s?.c79Reference} />
      <F label="Shipped" name="shippedAt" type="date" defaultValue={s?.shippedAt} />
      <F label="Arrived" name="arrivedAt" type="date" defaultValue={s?.arrivedAt} />
      <F
        type="checkbox"
        label="Import VAT is reclaimable"
        name="importVatReclaimable"
        defaultValue={s?.importVatReclaimable ? "1" : ""}
        hint="Only if VAT registered (reclaim via C79). Otherwise it's part of landed cost."
        className="md:col-span-2"
      />
      <F
        type="checkbox"
        label="DCTS 0% duty preference claimed"
        name="dctsPreferenceClaimed"
        defaultValue={s?.dctsPreferenceClaimed ? "1" : ""}
        hint="Keep the supplier's origin statement on file."
        className="md:col-span-2"
      />
      <FArea label="Notes" name="notes" defaultValue={s?.notes} rows={2} className="md:col-span-4" />
      <Submit className="md:col-span-4 md:justify-self-start">{s ? "Save shipment" : "Add shipment"}</Submit>
    </AdminForm>
  );
}
