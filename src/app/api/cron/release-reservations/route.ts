import { timingSafeEqual } from "node:crypto";
import { releaseExpiredReservations } from "@/server/orders/orders";
import { reconcilePendingOrders } from "@/server/payments/reconcile";
import { syncPendingClickAndDrop } from "@/server/shipping-providers";

/**
 * Safety-net job: (1) asks Stripe about checkouts whose webhook hasn't arrived,
 * (2) releases stock held by checkouts that never completed payment,
 * (3) pulls Royal Mail Click & Drop tracking for orders awaiting dispatch.
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
  const reconciled = await reconcilePendingOrders().catch((e) => {
    console.error("[cron] reconcile failed", e);
    return 0;
  });
  const released = await releaseExpiredReservations();
  const dispatched = await syncPendingClickAndDrop().catch((e) => {
    console.error("[cron] Click & Drop sync failed", e);
    return 0;
  });
  return Response.json({ reconciled, released, dispatched });
}
