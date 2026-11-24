"use client";

import { useRouter } from "next/navigation";
import { saveSupplierAction } from "./actions";
import { AdminForm, F, FArea, FSelect, Submit } from "@/components/admin/admin-form";

export interface SupplierData {
  id: string;
  name: string;
  type: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  district: string | null;
  country: string;
  currency: string;
  paymentTerms: string | null;
  leadTimeDays: number | null;
  certifications: string | null;
  notes: string | null;
  isActive: boolean;
}

export function SupplierForm({ s }: { s?: SupplierData }) {
  const router = useRouter();
  return (
    <AdminForm
      action={saveSupplierAction}
      onSuccess={(d: unknown) => !s && router.push(`/admin/suppliers/${(d as { id: string }).id}`)}
      className="grid gap-3 md:grid-cols-3"
    >
      {s && <input type="hidden" name="id" value={s.id} />}
      <F label="Name" name="name" defaultValue={s?.name} />
      <FSelect
        label="Type"
        name="type"
        defaultValue={s?.type ?? "WORKSHOP"}
        options={["MANUFACTURER", "ARTISAN", "WORKSHOP", "COOPERATIVE", "WHOLESALER"].map((t) => ({ value: t, label: t.toLowerCase() }))}
      />
      <F label="Contact name" name="contactName" defaultValue={s?.contactName ?? ""} />
      <F label="Email" name="email" type="email" defaultValue={s?.email ?? ""} />
      <F label="Phone" name="phone" defaultValue={s?.phone ?? ""} />
      <F label="WhatsApp" name="whatsapp" defaultValue={s?.whatsapp ?? ""} />
      <F label="Address" name="address" defaultValue={s?.address ?? ""} className="md:col-span-2" />
      <F label="District / city" name="district" defaultValue={s?.district ?? ""} placeholder="e.g. Palpa, Kathmandu" />
      <F label="Country" name="country" defaultValue={s?.country ?? "Nepal"} />
      <FSelect
        label="Invoice currency"
        name="currency"
        defaultValue={s?.currency ?? "NPR"}
        options={["NPR", "GBP", "USD", "INR", "EUR"].map((c) => ({ value: c, label: c }))}
      />
      <F label="Lead time (days)" name="leadTimeDays" type="number" defaultValue={s?.leadTimeDays ?? ""} />
      <F
        label="Payment terms"
        name="paymentTerms"
        defaultValue={s?.paymentTerms ?? ""}
        placeholder="e.g. 50% deposit, 50% before shipping"
        className="md:col-span-2"
      />
      <F label="Certifications" name="certifications" defaultValue={s?.certifications ?? ""} placeholder="e.g. Fair Trade Group Nepal member" />
      <FArea label="Notes" name="notes" defaultValue={s?.notes ?? ""} rows={3} className="md:col-span-3" />
      <F type="checkbox" label="Active supplier" name="isActive" defaultValue={!s || s.isActive ? "1" : ""} />
      <Submit className="md:col-span-3 md:justify-self-start">{s ? "Save supplier" : "Add supplier"}</Submit>
    </AdminForm>
  );
}
