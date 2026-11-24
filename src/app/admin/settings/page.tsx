import { Suspense } from "react";
import { saveBusinessAction, saveCommerceAction, saveShippingAction, saveTaxClassAction } from "./actions";
import { AdminForm, F, FArea, Submit } from "@/components/admin/admin-form";
import { AdminHeader, AdminSkeleton, Card } from "@/components/admin/ui";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";
import { getSettings } from "@/server/settings";

export const metadata = { title: "Store settings" };
const p = (v: number | null) => (v === null ? "" : (v / 100).toFixed(2));

export default function SettingsPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Settings />
    </Suspense>
  );
}

type Method = Awaited<ReturnType<typeof db.shippingMethod.findMany>>[number];
function ShippingForm({ m }: { m?: Method }) {
  return (
    <AdminForm action={saveShippingAction} resetOnSuccess={!m} className="grid gap-3 sm:grid-cols-4">
      {m && <input type="hidden" name="id" value={m.id} />}
      <F label="Name" name="name" defaultValue={m?.name} />
      <F label="Code" name="code" defaultValue={m?.code} hint="e.g. uk-standard" />
      <F label="Carrier" name="carrier" defaultValue={m?.carrier ?? "Royal Mail"} />
      <F label="Price (£)" name="pricePence" inputMode="decimal" defaultValue={m ? p(m.pricePence) : ""} />
      <F label="Free over (£)" name="freeOverPence" inputMode="decimal" defaultValue={m ? p(m.freeOverPence) : ""} hint="Blank = never free" />
      <F label="Min days" name="estimatedMinDays" type="number" defaultValue={m?.estimatedMinDays ?? 2} />
      <F label="Max days" name="estimatedMaxDays" type="number" defaultValue={m?.estimatedMaxDays ?? 4} />
      <F label="Sort" name="sortOrder" type="number" defaultValue={m?.sortOrder ?? 0} />
      <F label="Description shown at checkout" name="description" defaultValue={m?.description ?? ""} className="sm:col-span-3" />
      <F type="checkbox" label="Active" name="isActive" defaultValue={!m || m.isActive ? "1" : ""} />
      <Submit variant={m ? "outline" : "primary"} className="sm:col-span-4 sm:justify-self-start">
        {m ? "Save" : "Add delivery method"}
      </Submit>
    </AdminForm>
  );
}

async function Settings() {
  await requirePermission("settings.manage", "/admin/settings");
  const [s, methods, taxClasses] = await Promise.all([
    getSettings(),
    db.shippingMethod.findMany({ orderBy: { sortOrder: "asc" } }),
    db.taxClass.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <AdminHeader title="Store settings" description="Business details, VAT, delivery and SEO. Every change is recorded in the audit log." />
      <Card title="Business details & social links">
        <AdminForm action={saveBusinessAction} className="grid gap-4 md:grid-cols-2">
          <F label="Store name" name="name" defaultValue={s.business.name} />
          <F label="Legal business name" name="legalName" defaultValue={s.business.legalName} />
          <F label="Customer service email" name="email" type="email" defaultValue={s.business.email} />
          <F label="Phone" name="phone" defaultValue={s.business.phone} />
          <F label="Opening hours" name="hours" defaultValue={s.business.hours} />
          <F label="Registered address" name="address" defaultValue={s.business.address} />
          <F label="Company number" name="companyNumber" defaultValue={s.business.companyNumber} />
          <F label="VAT number" name="vatNumber" defaultValue={s.business.vatNumber} />
          <F label="Instagram URL" name="instagram" defaultValue={s.social.instagram} />
          <F label="TikTok URL" name="tiktok" defaultValue={s.social.tiktok} />
          <F label="Facebook URL" name="facebook" defaultValue={s.social.facebook} />
          <Submit className="md:col-span-2 md:justify-self-start">Save business details</Submit>
        </AdminForm>
      </Card>

      <Card title="Checkout, VAT & SEO">
        <AdminForm action={saveCommerceAction} className="grid gap-4 md:grid-cols-2">
          <F
            type="checkbox"
            label="VAT registered"
            name="vatRegistered"
            defaultValue={s.tax.vatRegistered ? "1" : ""}
            hint="Turn on only once HMRC has registered you (threshold £90,000). Prices stay VAT-inclusive; VAT is shown on invoices."
          />
          <F type="checkbox" label="Show VAT breakdown on invoices" name="showVatOnInvoices" defaultValue={s.tax.showVatOnInvoices ? "1" : ""} />
          <F
            label="VAT rate on delivery charges (%)"
            name="shippingTaxRatePercent"
            inputMode="decimal"
            defaultValue={s.tax.shippingTaxRateBps / 100}
            hint="Usually follows the goods — confirm with your accountant."
          />
          <F
            label="Returns window (days)"
            name="returnDays"
            type="number"
            defaultValue={s.commerce.returnDays}
            hint="Statutory minimum: 14 days after delivery."
          />
          <F
            label="Newsletter welcome discount (%)"
            name="newsletterDiscountPercent"
            type="number"
            defaultValue={s.commerce.newsletterDiscountPercent}
            hint="0 to turn off."
          />
          <F label="Hold stock during checkout (minutes)" name="reservationMinutes" type="number" defaultValue={s.commerce.reservationMinutes} />
          <F type="checkbox" label="Allow guest checkout" name="allowGuestCheckout" defaultValue={s.commerce.allowGuestCheckout ? "1" : ""} />
          <FArea label="Popular searches (one per line)" name="popularSearches" defaultValue={s.popularSearches.join("\n")} rows={4} />
          <F label="Default page title" name="defaultTitle" defaultValue={s.seo.defaultTitle} maxLength={70} />
          <FArea label="Default meta description" name="defaultDescription" defaultValue={s.seo.defaultDescription} rows={2} maxLength={170} />
          <Submit className="md:col-span-2 md:justify-self-start">Save settings</Submit>
        </AdminForm>
      </Card>

      <Card title="Delivery methods">
        <ul className="space-y-4">
          {methods.map((m) => (
            <li key={m.id} className="rounded-[2px] border border-sand p-4">
              <ShippingForm m={m} />
            </li>
          ))}
        </ul>
        <details className="mt-4 rounded-[2px] border border-dashed border-sand-deep p-4">
          <summary className="cursor-pointer text-sm font-semibold">+ Add a delivery method</summary>
          <div className="mt-3">
            <ShippingForm />
          </div>
        </details>
      </Card>

      <Card title="Tax classes">
        <p className="mb-4 text-sm text-bark">
          Assign a tax class to each product. Rates only apply when VAT registered. Confirm zero-rating of children&apos;s clothing (VAT Notice 714)
          with your accountant.
        </p>
        <ul className="space-y-3">
          {[...taxClasses, undefined].map((t) => (
            <li key={t?.id ?? "new"}>
              <AdminForm action={saveTaxClassAction} resetOnSuccess={!t} className="grid items-end gap-3 sm:grid-cols-4">
                {t && <input type="hidden" name="id" value={t.id} />}
                <F label="Name" name="name" defaultValue={t?.name} />
                <F label="Rate (%)" name="ratePercent" inputMode="decimal" defaultValue={t ? t.rateBps / 100 : ""} />
                <F label="Description" name="description" defaultValue={t?.description ?? ""} />
                <Submit variant={t ? "outline" : "primary"}>{t ? "Save" : "Add tax class"}</Submit>
              </AdminForm>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
