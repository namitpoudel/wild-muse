import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  cancelOrderAction,
  dispatchOrderAction,
  recheckPaymentAction,
  refundOrderAction,
  saveOrderNotesAction,
  sendToClickAndDropAction,
  setOrderStatusAction,
  syncShipmentAction,
} from "../actions";
import { isClickAndDropConfigured } from "@/server/shipping-providers/click-and-drop";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { AdminForm, F, FArea, FSelect, Submit } from "@/components/admin/admin-form";
import { AdminHeader, AdminSkeleton, Card } from "@/components/admin/ui";
import { formatPenceExact } from "@/lib/money";
import { getAdminOrder } from "@/server/admin/orders";
import { can } from "@/server/auth/permissions";
import { requirePermission } from "@/server/auth/session";
import { formatOrderNumber } from "@/server/orders/format";
import { CARRIERS } from "@/server/shipping-tracking";

export const metadata = { title: "Order" };
const dt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
type Addr = { fullName: string; line1: string; line2?: string | null; city: string; county?: string | null; postcode: string; phone?: string | null };

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

function AddressBlock({ a }: { a: Addr }) {
  return (
    <address className="text-sm not-italic">
      {a.fullName}
      <br />
      {a.line1}
      {a.line2 && <>, {a.line2}</>}
      <br />
      {a.city}
      {a.county && `, ${a.county}`} {a.postcode}
      {a.phone && (
        <>
          <br />
          {a.phone}
        </>
      )}
    </address>
  );
}

async function OrderDetail({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  const user = await requirePermission("orders.view", "/admin/orders");
  const { id } = await params;
  const o = await getAdminOrder(id.slice(0, 40));
  if (!o) notFound();
  const canUpdate = can(user.role, "orders.update");
  const canRefund = can(user.role, "orders.refund");
  const open = ["PAID", "PROCESSING"].includes(o.status);
  const clickAndDrop = isClickAndDropConfigured();
  return (
    <div className="space-y-6">
      <AdminHeader
        title={formatOrderNumber(o.orderNumber)}
        back={{ href: "/admin/orders", label: "Orders" }}
        description={`Placed ${dt.format(o.placedAt ?? o.createdAt)} · ${o.email}${o.user ? " (account)" : " (guest)"}`}
        actions={
          <>
            <OrderStatusBadge status={o.status} />
            <Link href={`/invoice/${o.id}`} target="_blank" className="text-sm font-semibold underline">
              Invoice ↗
            </Link>
          </>
        }
      />
      {o.internalNotes?.includes("STOCK CONFLICT") && (
        <p className="rounded-[2px] border border-danger/40 bg-danger/5 p-4 text-sm text-danger">⚠ Stock conflict on this order — see notes below.</p>
      )}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Items">
            <ul className="divide-y divide-sand text-sm">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-2.5">
                  <span>
                    <Link href={`/admin/products/${i.productId}`} className="font-medium hover:underline">
                      {i.productName}
                    </Link>
                    <span className="block text-xs text-bark">
                      {i.colour} · {i.size} · SKU {i.sku} · {formatPenceExact(i.unitPricePence)} × {i.quantity}
                    </span>
                  </span>
                  <span className="font-semibold">{formatPenceExact(i.unitPricePence * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-sand pt-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatPenceExact(o.subtotalPence)}</dd>
              </div>
              {o.discountPence > 0 && (
                <div className="flex justify-between">
                  <dt>Discount ({o.couponCode})</dt>
                  <dd>−{formatPenceExact(o.discountPence)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Delivery — {o.shippingMethodName}</dt>
                <dd>{formatPenceExact(o.shippingPence)}</dd>
              </div>
              <div className="flex justify-between font-bold">
                <dt>Total</dt>
                <dd>{formatPenceExact(o.totalPence)}</dd>
              </div>
              {o.vatRegistered && (
                <div className="flex justify-between text-bark">
                  <dt>VAT included</dt>
                  <dd>{formatPenceExact(o.taxPence)}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title="Fulfilment">
            {o.shipments.length ? (
              <ul className="mb-4 space-y-3 text-sm">
                {o.shipments.map((s) => (
                  <li key={s.id} className="rounded-[2px] bg-cream p-3">
                    <strong>{s.carrier}</strong> {s.service && `· ${s.service}`} · {s.status.toLowerCase()}
                    {s.trackingNumber && (
                      <span className="block">
                        Tracking:{" "}
                        {s.trackingUrl ? (
                          <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline">
                            {s.trackingNumber}
                          </a>
                        ) : (
                          s.trackingNumber
                        )}
                      </span>
                    )}
                    {s.dispatchedAt && <span className="block text-xs text-bark">Dispatched {dt.format(s.dispatchedAt)}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-bark">Not dispatched yet.</p>
            )}
            {canUpdate &&
              o.shipments
                .filter((s) => s.providerRef && ["PENDING", "LABEL_CREATED"].includes(s.status))
                .map((s) => (
                  <AdminForm key={s.id} action={syncShipmentAction} className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                    <input type="hidden" name="shipmentId" value={s.id} />
                    <span>
                      Click & Drop order {s.providerRef} — {s.status === "LABEL_CREATED" ? "label printed" : "awaiting label"}
                    </span>
                    <Submit variant="outline">Check for tracking</Submit>
                  </AdminForm>
                ))}
            {canUpdate && open && clickAndDrop && !o.shipments.some((s) => s.providerRef) && (
              <AdminForm action={sendToClickAndDropAction} className="mb-4 flex flex-wrap items-center gap-3 border-b border-sand pb-4">
                <input type="hidden" name="id" value={o.id} />
                <Submit variant="dark">Send to Royal Mail Click & Drop</Submit>
                <span className="text-xs text-bark">
                  Creates the order in Click & Drop so you can print the label. Tracking syncs back automatically.
                </span>
              </AdminForm>
            )}
            {canUpdate && open && (
              <AdminForm action={dispatchOrderAction} className="grid gap-3 border-t border-sand pt-4 sm:grid-cols-2">
                <input type="hidden" name="id" value={o.id} />
                <FSelect label="Carrier" name="carrier" options={Object.entries(CARRIERS).map(([k, c]) => ({ value: k, label: c.name }))} />
                <F label="Service" name="service" placeholder="e.g. Tracked 48" />
                <F label="Tracking number" name="trackingNumber" />
                <F label="Tracking URL (optional)" name="trackingUrl" hint="Built automatically for known carriers." />
                <F type="checkbox" label="Email the customer" name="notify" defaultValue="1" className="sm:col-span-2" />
                <Submit variant="dark" className="sm:col-span-2 sm:justify-self-start">
                  Mark as dispatched manually
                </Submit>
              </AdminForm>
            )}
            {canUpdate && (o.status === "PAID" || o.status === "PROCESSING" || o.status === "DISPATCHED" || o.status === "DELIVERED") && (
              <AdminForm action={setOrderStatusAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-sand pt-4">
                <input type="hidden" name="id" value={o.id} />
                <FSelect
                  label="Change status"
                  name="status"
                  options={
                    o.status === "PAID"
                      ? [{ value: "PROCESSING", label: "Being prepared" }]
                      : o.status === "PROCESSING"
                        ? [{ value: "PAID", label: "Back to paid" }]
                        : o.status === "DISPATCHED"
                          ? [{ value: "DELIVERED", label: "Delivered" }]
                          : [{ value: "DISPATCHED", label: "Back to dispatched" }]
                  }
                />
                <Submit variant="outline">Update</Submit>
              </AdminForm>
            )}
          </Card>

          <Card title="Internal notes">
            <AdminForm action={saveOrderNotesAction} className="space-y-3">
              <input type="hidden" name="id" value={o.id} />
              <FArea label="Notes (never shown to the customer)" name="internalNotes" defaultValue={o.internalNotes ?? ""} rows={4} />
              {canUpdate && <Submit variant="outline">Save notes</Submit>}
            </AdminForm>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <p className="text-sm">
              {o.user ? (
                <Link href={`/admin/customers/${o.user.id}`} className="font-semibold underline">
                  {o.user.name}
                </Link>
              ) : (
                "Guest checkout"
              )}
              <span className="block text-bark">{o.email}</span>
              <span className="block text-xs text-bark">Marketing opt-in: {o.marketingOptIn ? "yes" : "no"}</span>
            </p>
            <h3 className="mt-4 text-sm font-semibold">Delivery address</h3>
            <AddressBlock a={o.shippingAddress as unknown as Addr} />
            {o.deliveryInstructions && <p className="mt-2 rounded-[2px] bg-cream p-2 text-xs">“{o.deliveryInstructions}”</p>}
            <h3 className="mt-4 text-sm font-semibold">Billing address</h3>
            <AddressBlock a={o.billingAddress as unknown as Addr} />
          </Card>

          <Card title="Payment">
            {o.payments.length ? (
              <ul className="space-y-1 text-sm">
                {o.payments.map((p) => (
                  <li key={p.id}>
                    {formatPenceExact(p.amountPence)} · {p.method ?? p.provider} · {p.status.toLowerCase()}
                    <span className="block font-mono text-xs text-bark">{p.providerPaymentId}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-bark">No payment recorded.</p>
            )}
            {o.refunds.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-sand pt-3 text-sm">
                {o.refunds.map((r) => (
                  <li key={r.id}>
                    Refund {formatPenceExact(r.amountPence)} · {r.status.toLowerCase()} — {r.reason}
                  </li>
                ))}
              </ul>
            )}
            {canRefund && o.payments.some((p) => p.status === "SUCCEEDED") && (
              <AdminForm
                action={refundOrderAction}
                confirm="Refund this amount to the customer's card? This can't be undone."
                className="mt-4 space-y-3 border-t border-sand pt-4"
              >
                <input type="hidden" name="id" value={o.id} />
                <F
                  label="Refund amount (£)"
                  name="amountPence"
                  inputMode="decimal"
                  defaultValue={(
                    (o.totalPence - o.refunds.filter((r) => r.status !== "FAILED").reduce((n, r) => n + r.amountPence, 0)) /
                    100
                  ).toFixed(2)}
                />
                <F label="Reason" name="reason" placeholder="e.g. Returned within 14 days" />
                <F type="checkbox" label="Return items to stock (full refunds)" name="restock" />
                <Submit variant="outline">Refund via Stripe</Submit>
              </AdminForm>
            )}
          </Card>

          {canUpdate && o.status === "PENDING_PAYMENT" && o.stripeCheckoutSessionId && (
            <Card title="Awaiting payment">
              <p className="mb-3 text-sm text-bark">
                The customer started paying on Stripe. If they say they paid but this hasn&apos;t updated, ask Stripe directly:
              </p>
              <AdminForm action={recheckPaymentAction}>
                <input type="hidden" name="id" value={o.id} />
                <Submit variant="outline">Check payment with Stripe</Submit>
              </AdminForm>
            </Card>
          )}
          {canUpdate && ["PENDING_PAYMENT", "PAID", "PROCESSING"].includes(o.status) && (
            <Card title="Cancel order">
              <AdminForm action={cancelOrderAction} confirm="Cancel this order?" className="space-y-3">
                <input type="hidden" name="id" value={o.id} />
                <F label="Reason" name="reason" />
                {o.status !== "PENDING_PAYMENT" && <F type="checkbox" label="Return items to stock" name="restock" defaultValue="1" />}
                <F type="checkbox" label="Email the customer" name="notify" defaultValue={o.status !== "PENDING_PAYMENT" ? "1" : ""} />
                {o.status !== "PENDING_PAYMENT" && (
                  <p className="text-xs text-bark">Cancelling doesn&apos;t move money — issue the refund as well.</p>
                )}
                <Submit variant="danger">Cancel order</Submit>
              </AdminForm>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
