"use server";

import { z } from "zod";
import { emailSchema } from "@/lib/validation";
import { db } from "@/server/db";
import { formatOrderNumber, ORDER_STATUS_LABEL, parseOrderNumber } from "@/server/orders/format";
import { rateLimit } from "@/server/security/rate-limit";
import { fail, ok, type ActionResult } from "./result";

export interface TrackResult {
  number: string;
  status: string;
  statusLabel: string;
  placedAt: string | null;
  items: string[];
  shipments: {
    carrier: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    status: string;
    events: { at: string; description: string }[];
  }[];
}

/**
 * Guest order tracking. Requires BOTH the order number and the email used, is rate limited,
 * and returns the same error for "not found" and "wrong email" (no enumeration).
 */
export async function trackOrderAction(input: { order: string; email: string }): Promise<ActionResult<TrackResult>> {
  const rl = await rateLimit("track", { max: 10, windowSeconds: 600 });
  if (!rl.ok) return fail("Too many attempts — please try again in a few minutes.");
  const parsed = z.object({ order: z.string().max(20), email: emailSchema }).safeParse(input);
  const n = parsed.success ? parseOrderNumber(parsed.data.order) : null;
  if (!parsed.success || !n) return fail("Enter your order number (like WM-10042) and the email you used.");
  const o = await db.order.findFirst({
    where: { orderNumber: n, email: parsed.data.email, status: { not: "PENDING_PAYMENT" } },
    include: { items: { select: { productName: true, quantity: true } }, shipments: { include: { events: { orderBy: { occurredAt: "desc" } } } } },
  });
  if (!o) return fail("We couldn't find an order with those details. Check the number and email, or contact us.");
  const dt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return ok({
    number: formatOrderNumber(o.orderNumber),
    status: o.status,
    statusLabel: ORDER_STATUS_LABEL[o.status] ?? o.status,
    placedAt: o.placedAt ? dt.format(o.placedAt) : null,
    items: o.items.map((i) => `${i.quantity} × ${i.productName}`),
    shipments: o.shipments.map((s) => ({
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      trackingUrl: s.trackingUrl,
      status: s.status,
      events: s.events.map((e) => ({ at: dt.format(e.occurredAt), description: e.description })),
    })),
  });
}
