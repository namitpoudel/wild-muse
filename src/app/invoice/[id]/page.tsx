import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PrintButton } from "@/components/admin/print-button";
import { formatPenceExact } from "@/lib/money";
import { getCurrentUser } from "@/server/auth/session";
import { can } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { formatOrderNumber } from "@/server/orders/format";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };
const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });
type Addr = { fullName: string; line1: string; line2?: string | null; city: string; county?: string | null; postcode: string };

export default function InvoicePage({ params }: PageProps<"/invoice/[id]">) {
  return (
    <Suspense fallback={<p className="p-10">Loading invoice…</p>}>
      <Invoice params={params} />
    </Suspense>
  );
}

/** Printable invoice — visible to the customer who placed the order and to staff with orders.view. */
async function Invoice({ params }: Pick<PageProps<"/invoice/[id]">, "params">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();
  const o = await db.order.findUnique({ where: { id: id.slice(0, 40) }, include: { items: true, refunds: { where: { status: "SUCCEEDED" } } } });
  if (!o || o.status === "PENDING_PAYMENT" || (o.userId !== user.id && !can(user.role, "orders.view"))) notFound();
  const s = await getSettings();
  const bill = o.billingAddress as unknown as Addr;
  const ship = o.shippingAddress as unknown as Addr;
  const vatInvoice = o.vatRegistered && s.tax.showVatOnInvoices;
  const addr = (a: Addr) => [a.fullName, a.line1, a.line2, a.city, a.county, a.postcode].filter(Boolean).join("\n");
  return (
    <main id="main" className="mx-auto max-w-3xl bg-white p-8 text-sm text-chocolate print:p-0">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-chocolate pb-6">
        <div>
          <p className="font-display text-2xl tracking-[0.2em]">{s.business.name}</p>
          <p className="mt-2 whitespace-pre-line text-bark">
            {s.business.legalName}
            {"\n"}
            {s.business.address}
            {"\n"}
            {s.business.email}
          </p>
          {s.business.companyNumber && <p className="text-bark">Company no. {s.business.companyNumber}</p>}
          {vatInvoice && s.business.vatNumber && <p className="text-bark">VAT no. {s.business.vatNumber}</p>}
        </div>
        <div className="text-right">
          <h1 className="font-display text-3xl">{vatInvoice ? "VAT invoice" : "Invoice"}</h1>
          <p className="mt-2">
            <strong>Invoice / order:</strong> {formatOrderNumber(o.orderNumber)}
          </p>
          <p>
            <strong>Date:</strong> {date.format(o.placedAt ?? o.createdAt)}
          </p>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-6 py-6">
        <div>
          <p className="eyebrow mb-1 text-bark">Billed to</p>
          <p className="whitespace-pre-line">{addr(bill)}</p>
          <p className="mt-1 text-bark">{o.email}</p>
        </div>
        <div>
          <p className="eyebrow mb-1 text-bark">Delivered to</p>
          <p className="whitespace-pre-line">{addr(ship)}</p>
        </div>
      </section>
      <table className="w-full">
        <thead>
          <tr className="border-b border-chocolate text-left">
            <th className="py-2">Item</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Unit price</th>
            {vatInvoice && <th className="py-2 text-right">VAT rate</th>}
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i) => (
            <tr key={i.id} className="border-b border-sand">
              <td className="py-2">
                {i.productName}
                <span className="block text-xs text-bark">
                  {i.colour} · {i.size} · SKU {i.sku}
                </span>
              </td>
              <td className="py-2 text-right">{i.quantity}</td>
              <td className="py-2 text-right">{formatPenceExact(i.unitPricePence)}</td>
              {vatInvoice && <td className="py-2 text-right">{i.taxRateBps / 100}%</td>}
              <td className="py-2 text-right">{formatPenceExact(i.unitPricePence * i.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ml-auto mt-4 w-64 space-y-1">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatPenceExact(o.subtotalPence)}</dd>
        </div>
        {o.discountPence > 0 && (
          <div className="flex justify-between">
            <dt>Discount</dt>
            <dd>−{formatPenceExact(o.discountPence)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Delivery</dt>
          <dd>{formatPenceExact(o.shippingPence)}</dd>
        </div>
        <div className="flex justify-between border-t border-chocolate pt-1 font-bold">
          <dt>Total paid</dt>
          <dd>{formatPenceExact(o.totalPence)}</dd>
        </div>
        {vatInvoice && (
          <>
            <div className="flex justify-between text-bark">
              <dt>Total excl. VAT</dt>
              <dd>{formatPenceExact(o.totalPence - o.taxPence)}</dd>
            </div>
            <div className="flex justify-between text-bark">
              <dt>VAT included</dt>
              <dd>{formatPenceExact(o.taxPence)}</dd>
            </div>
          </>
        )}
        {o.refunds.map((r) => (
          <div key={r.id} className="flex justify-between text-terracotta">
            <dt>Refunded</dt>
            <dd>−{formatPenceExact(r.amountPence)}</dd>
          </div>
        ))}
      </dl>
      {!vatInvoice && (
        <p className="mt-8 text-xs text-bark">{o.vatRegistered ? "" : "This business is not registered for VAT. No VAT has been charged."}</p>
      )}
      <p className="mt-2 text-xs text-bark">
        Thank you for shopping with {s.business.name}. You can cancel within 14 days of receiving your goods — see our Returns & Refunds policy.
      </p>
    </main>
  );
}
