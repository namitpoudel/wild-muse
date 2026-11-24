"use server";

import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { createReturnRequest } from "@/server/returns";
import { rateLimit } from "@/server/security/rate-limit";
import { fail, ok, type ActionResult } from "./result";

export async function requestReturnAction(input: {
  orderId: string;
  lines: { orderItemId: string; quantity: number }[];
  reason: string;
}): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in.");
  const parsed = z
    .object({
      orderId: z.string().max(40),
      lines: z.array(z.object({ orderItemId: z.string().max(40), quantity: z.number().int().min(0).max(100) })).max(100),
      reason: z.string().trim().min(3, "Tell us briefly why").max(500),
    })
    .safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  const rl = await rateLimit("return", { max: 5, windowSeconds: 3600, key: user.id });
  if (!rl.ok) return fail("Too many requests — please contact us instead.");
  const order = await db.order.findFirst({ where: { id: parsed.data.orderId, userId: user.id }, select: { id: true } });
  if (!order) return fail("Order not found.");
  try {
    await createReturnRequest({ orderId: order.id, lines: parsed.data.lines.filter((l) => l.quantity > 0), reason: parsed.data.reason });
  } catch (e) {
    return fail((e as Error).message);
  }
  return ok(null, "Return requested — we've emailed you the next steps.");
}
