import { Suspense } from "react";
import { deleteCouponAction, saveCouponAction } from "./actions";
import { AdminForm, F, FSelect, Submit } from "@/components/admin/admin-form";
import { AdminHeader, AdminSkeleton, Card } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatPenceExact } from "@/lib/money";
import { requirePermission } from "@/server/auth/session";
import { db } from "@/server/db";

export const metadata = { title: "Discount codes" };
type Coupon = Awaited<ReturnType<typeof db.coupon.findMany>>[number];
const d = (x: Date | null) => (x ? x.toISOString().slice(0, 10) : "");

function CouponForm({ c }: { c?: Coupon }) {
  return (
    <AdminForm action={saveCouponAction} resetOnSuccess={!c} className="grid gap-3 sm:grid-cols-3">
      {c && <input type="hidden" name="id" value={c.id} />}
      <F label="Code" name="code" defaultValue={c?.code} placeholder="SUMMER15" />
      <FSelect
        label="Type"
        name="type"
        defaultValue={c?.type ?? "PERCENT"}
        options={[
          { value: "PERCENT", label: "% off" },
          { value: "FIXED", label: "£ off" },
          { value: "FREE_SHIPPING", label: "Free delivery" },
        ]}
      />
      <F
        label="Value (% or £)"
        name="value"
        inputMode="decimal"
        defaultValue={c ? (c.type === "FIXED" ? (c.value / 100).toFixed(2) : c.value) : ""}
      />
      <F
        label="Minimum spend (£)"
        name="minSubtotalPence"
        inputMode="decimal"
        defaultValue={c?.minSubtotalPence ? (c.minSubtotalPence / 100).toFixed(2) : ""}
      />
      <F label="Starts" name="startsAt" type="date" defaultValue={d(c?.startsAt ?? null)} />
      <F label="Ends" name="endsAt" type="date" defaultValue={d(c?.endsAt ?? null)} />
      <F label="Total uses allowed" name="usageLimit" type="number" defaultValue={c?.usageLimit ?? ""} hint="Blank = unlimited" />
      <F label="Uses per customer" name="perCustomerLimit" type="number" defaultValue={c?.perCustomerLimit ?? 1} hint="Blank = unlimited" />
      <F label="Internal description" name="description" defaultValue={c?.description ?? ""} />
      <F type="checkbox" label="First order only" name="firstOrderOnly" defaultValue={c?.firstOrderOnly ? "1" : ""} />
      <F type="checkbox" label="Active" name="isActive" defaultValue={!c || c.isActive ? "1" : ""} />
      <Submit className="sm:col-span-3 sm:justify-self-start">{c ? "Save code" : "Create code"}</Submit>
    </AdminForm>
  );
}

export default function DiscountsPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Discounts />
    </Suspense>
  );
}

async function Discounts() {
  await requirePermission("discounts.manage", "/admin/discounts");
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const describe = (c: Coupon) =>
    c.type === "PERCENT" ? `${c.value}% off` : c.type === "FIXED" ? `${formatPenceExact(c.value)} off` : "Free delivery";
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Discount codes"
        description="Codes are validated on the server at checkout — limits, dates and minimum spend are always enforced."
      />
      <Card title="Create a code">
        <CouponForm />
      </Card>
      <Card title={`All codes (${coupons.length})`}>
        <ul className="divide-y divide-sand">
          {coupons.map((c) => (
            <li key={c.id} className="py-3">
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm">
                  <span className="font-mono font-semibold">{c.code}</span>
                  <span>{describe(c)}</span>
                  <span className="text-bark">
                    used {c.usedCount}
                    {c.usageLimit ? `/${c.usageLimit}` : ""}
                  </span>
                  <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "active" : "inactive"}</Badge>
                  {c.description && <span className="text-xs text-bark">{c.description}</span>}
                </summary>
                <div className="mt-3 space-y-3 rounded-[2px] bg-cream/50 p-4">
                  <CouponForm c={c} />
                  <AdminForm action={deleteCouponAction} confirm={`Delete ${c.code}?`}>
                    <input type="hidden" name="id" value={c.id} />
                    <Submit variant="danger">Delete</Submit>
                  </AdminForm>
                </div>
              </details>
            </li>
          ))}
          {!coupons.length && <li className="py-3 text-sm text-bark">No codes yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
