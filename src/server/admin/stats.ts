import "server-only";
import { db } from "../db";

const PAID = ["PAID", "PROCESSING", "DISPATCHED", "DELIVERED", "PARTIALLY_REFUNDED", "REFUNDED"] as const;

/** Dashboard metrics — all computed from real orders (never estimated or seeded). */
export async function getDashboardStats() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const since30 = new Date(startOfDay.getTime() - 29 * 86400_000);
  const paid = { status: { in: [...PAID] } };

  const [all, today, month, refunds, counts, customers, daily, best, lowStock, recent] = await Promise.all([
    db.order.aggregate({ where: paid, _sum: { totalPence: true }, _count: true }),
    db.order.aggregate({ where: { ...paid, placedAt: { gte: startOfDay } }, _sum: { totalPence: true } }),
    db.order.aggregate({ where: { ...paid, placedAt: { gte: startOfMonth } }, _sum: { totalPence: true }, _count: true }),
    db.refund.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amountPence: true } }),
    db.order.groupBy({ by: ["status"], _count: true }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.$queryRaw<{ day: Date; total: bigint; orders: bigint }[]>`
      SELECT date_trunc('day', "placedAt") AS day, SUM("totalPence")::bigint AS total, COUNT(*)::bigint AS orders
      FROM "Order" WHERE "placedAt" >= ${since30} AND status::text IN ('PAID','PROCESSING','DISPATCHED','DELIVERED','PARTIALLY_REFUNDED','REFUNDED')
      GROUP BY 1 ORDER BY 1`,
    db.orderItem.groupBy({
      by: ["productId", "productName"],
      where: { order: paid },
      _sum: { quantity: true, lineTotalPence: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    db.$queryRaw<{ id: string; sku: string; size: string; colour: string; available: number; threshold: number; name: string; productId: string }[]>`
      SELECT v.id, v.sku, v.size, v.colour, (v."stockOnHand" - v."stockReserved")::int AS available, v."lowStockThreshold" AS threshold, p.name, p.id AS "productId"
      FROM "ProductVariant" v JOIN "Product" p ON p.id = v."productId"
      WHERE v."isActive" AND p."deletedAt" IS NULL AND p.status = 'PUBLISHED' AND v."stockOnHand" - v."stockReserved" <= v."lowStockThreshold"
      ORDER BY available ASC, p.name LIMIT 10`,
    db.order.findMany({ where: { status: { not: "PENDING_PAYMENT" } }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  const by = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number>;
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(since30.getTime() + i * 86400_000);
    const row = daily.find((r) => new Date(r.day).toDateString() === d.toDateString());
    return { date: d.toISOString().slice(0, 10), totalPence: Number(row?.total ?? 0), orders: Number(row?.orders ?? 0) };
  });
  const gross = all._sum.totalPence ?? 0;
  return {
    totalSalesPence: gross - (refunds._sum.amountPence ?? 0),
    grossSalesPence: gross,
    todayPence: today._sum.totalPence ?? 0,
    monthPence: month._sum.totalPence ?? 0,
    totalOrders: all._count,
    pending: (by.PAID ?? 0) + (by.PROCESSING ?? 0),
    completed: (by.DISPATCHED ?? 0) + (by.DELIVERED ?? 0),
    cancelled: by.CANCELLED ?? 0,
    customers,
    aovPence: all._count ? Math.round(gross / all._count) : 0,
    days,
    best: best.map((b) => ({ productId: b.productId, name: b.productName, units: b._sum.quantity ?? 0, revenuePence: b._sum.lineTotalPence ?? 0 })),
    lowStock,
    recent,
  };
}
