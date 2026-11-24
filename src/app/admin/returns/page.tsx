import Link from "next/link";
import { Suspense } from "react";
import { decideReturnAction } from "./actions";
import { AdminForm, F } from "@/components/admin/admin-form";
import { AdminHeader, AdminSkeleton } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatPenceExact } from "@/lib/money";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";
import { formatOrderNumber } from "@/server/orders/format";

export const metadata = { title: "Returns" };
const dt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
type Item = { name: string; colour: string; size: string; quantity: number; unitPricePence: number };
const btn = "h-10 rounded-[2px] px-4 text-xs font-semibold uppercase tracking-[0.12em]";

export default function ReturnsPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Returns />
    </Suspense>
  );
}

async function Returns() {
  await requirePermission("orders.view", "/admin/returns");
  const rows = await db.returnRequest.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100, include: { order: true } });
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Returns"
        description="Approve, receive and refund returns. Refunds must be issued within 14 days of receiving the goods (or proof of postage)."
      />
      <ul className="space-y-4">
        {rows.map((r) => {
          const items = r.items as Item[];
          const value = items.reduce((n, i) => n + i.unitPricePence * i.quantity, 0);
          return (
            <li key={r.id} className="rounded-[3px] border border-sand bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/admin/orders/${r.orderId}`} className="font-semibold hover:underline">
                  {formatOrderNumber(r.order.orderNumber)}
                </Link>
                <span className="flex items-center gap-2 text-xs text-bark">
                  {r.isStatutoryCancellation && <Badge tone="warning">14-day cancellation</Badge>}
                  <Badge tone={r.status === "REQUESTED" ? "warning" : r.status === "REJECTED" ? "danger" : "success"}>{r.status.toLowerCase()}</Badge>
                  {dt.format(r.createdAt)} · {r.order.email}
                </span>
              </div>
              <ul className="mt-3 text-sm">
                {items.map((i, n) => (
                  <li key={n}>
                    {i.quantity} × {i.name}{" "}
                    <span className="text-bark">
                      ({i.colour}, {i.size})
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm">
                <strong>Reason:</strong> {r.reason} · <strong>Item value:</strong> {formatPenceExact(value)}
              </p>
              {r.notes && <p className="mt-1 text-xs text-bark">Note: {r.notes}</p>}
              {["REQUESTED", "APPROVED"].includes(r.status) && (
                <AdminForm action={decideReturnAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-sand pt-4">
                  <input type="hidden" name="id" value={r.id} />
                  <F label="Note to customer / internal" name="note" className="min-w-72 flex-1" />
                  <F type="checkbox" label="Return items to stock" name="restock" defaultValue="1" />
                  {r.status === "REQUESTED" && (
                    <button name="decision" value="APPROVED" className={`${btn} bg-olive text-white`}>
                      Approve & send instructions
                    </button>
                  )}
                  <button name="decision" value="RECEIVED" className={`${btn} bg-chocolate text-linen`}>
                    Mark received
                  </button>
                  {r.status === "REQUESTED" && !r.isStatutoryCancellation && (
                    <button name="decision" value="REJECTED" className={`${btn} border border-danger text-danger`}>
                      Decline
                    </button>
                  )}
                </AdminForm>
              )}
              {r.status === "RECEIVED" && (
                <Link href={`/admin/orders/${r.orderId}`} className="mt-3 inline-block text-sm font-semibold underline">
                  Issue refund on the order →
                </Link>
              )}
            </li>
          );
        })}
        {!rows.length && <li className="rounded-[3px] border border-sand bg-white p-8 text-center text-sm text-bark">No returns yet.</li>}
      </ul>
    </div>
  );
}
