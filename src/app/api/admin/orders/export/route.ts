import type { NextRequest } from "next/server";
import { orderWhere } from "@/server/admin/orders";
import { assertPermission } from "@/server/auth/session";
import { db } from "@/server/db";
import { formatOrderNumber } from "@/server/orders/format";
import { audit } from "@/server/security/audit";

/** CSV export of orders (respects the list filters). Cells are escaped against CSV/formula injection. */
function cell(v: unknown) {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  let actor;
  try {
    actor = await assertPermission("orders.export");
  } catch {
    return new Response("Forbidden", { status: 403 });
  }
  const p = req.nextUrl.searchParams;
  const where = orderWhere({
    q: p.get("q") ?? undefined,
    status: p.get("status") ?? undefined,
    from: p.get("from") ?? undefined,
    to: p.get("to") ?? undefined,
  });
  const orders = await db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 10000, include: { items: true, shipments: true } });
  const head = [
    "Order",
    "Placed",
    "Status",
    "Email",
    "Name",
    "Postcode",
    "Items",
    "Subtotal",
    "Discount",
    "Coupon",
    "Delivery",
    "VAT",
    "Total",
    "Shipping method",
    "Tracking",
  ];
  const rows = orders.map((o) => {
    const a = o.shippingAddress as { fullName?: string; postcode?: string };
    return [
      formatOrderNumber(o.orderNumber),
      (o.placedAt ?? o.createdAt).toISOString(),
      o.status,
      o.email,
      a.fullName,
      a.postcode,
      o.items.map((i) => `${i.quantity}x ${i.sku}`).join("; "),
      (o.subtotalPence / 100).toFixed(2),
      (o.discountPence / 100).toFixed(2),
      o.couponCode,
      (o.shippingPence / 100).toFixed(2),
      (o.taxPence / 100).toFixed(2),
      (o.totalPence / 100).toFixed(2),
      o.shippingMethodName,
      o.shipments
        .map((s) => s.trackingNumber)
        .filter(Boolean)
        .join("; "),
    ];
  });
  await audit(actor, "orders.export", { type: "Order" }, { summary: `${orders.length} orders exported` });
  const csv = [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wild-muse-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
