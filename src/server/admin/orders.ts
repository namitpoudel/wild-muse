import "server-only";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { parseOrderNumber } from "../orders/format";

export interface OrderFilters {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
}

export function orderWhere(f: OrderFilters): Prisma.OrderWhereInput {
  const q = f.q?.trim().slice(0, 80);
  const n = q ? parseOrderNumber(q) : null;
  const statuses = ["PENDING_PAYMENT", "PAID", "PROCESSING", "DISPATCHED", "DELIVERED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"];
  return {
    ...(f.status && statuses.includes(f.status) ? { status: f.status as OrderStatus } : { status: { not: "PENDING_PAYMENT" } }),
    ...(q
      ? {
          OR: [
            ...(n ? [{ orderNumber: n }] : []),
            { email: { contains: q, mode: "insensitive" as const } },
            { shippingAddress: { path: ["fullName"], string_contains: q } },
            { items: { some: { sku: { contains: q, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
    ...(f.from || f.to
      ? { createdAt: { ...(f.from ? { gte: new Date(f.from) } : {}), ...(f.to ? { lte: new Date(`${f.to}T23:59:59`) } : {}) } }
      : {}),
  };
}

export async function listOrders(f: OrderFilters & { page: number }) {
  const where = orderWhere(f);
  const take = 25;
  const [rows, total] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (f.page - 1) * take, take, include: { items: { select: { quantity: true } } } }),
    db.order.count({ where }),
  ]);
  return { rows, total, pages: Math.max(1, Math.ceil(total / take)) };
}

export async function getAdminOrder(id: string) {
  return db.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: true,
      refunds: { orderBy: { createdAt: "desc" } },
      shipments: { include: { events: { orderBy: { occurredAt: "desc" } } }, orderBy: { createdAt: "desc" } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
}
