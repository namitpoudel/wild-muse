import { timingSafeEqual } from "node:crypto";
import { releaseExpiredReservations } from "@/server/orders/orders";

/**
 * Safety-net job: releases stock held by checkouts that never completed payment.
 * Schedule every 15 minutes (vercel.json → crons). Protected by CRON_SECRET.
 */
function authorised(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(req: Request) {
  if (!authorised(req)) return new Response("Unauthorised", { status: 401 });
  const released = await releaseExpiredReservations();
  return Response.json({ released });
}
