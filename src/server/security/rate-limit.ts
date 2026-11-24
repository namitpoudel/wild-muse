import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "../db";

/**
 * Fixed-window rate limiter backed by Postgres (works across serverless instances).
 * Keys are hashed so no raw IP addresses are stored.
 */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function rateLimit(
  action: string,
  opts: { max: number; windowSeconds: number; key?: string },
): Promise<{ ok: boolean; retryAfter: number }> {
  if (process.env.APP_RATE_LIMIT === "off") return { ok: true, retryAfter: 0 };
  const subject = opts.key ?? (await clientIp());
  const key = `app:${action}:${createHash("sha256").update(subject).digest("hex").slice(0, 32)}`;
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  // Atomic upsert: reset the window if expired, otherwise increment.
  const rows = await db.$queryRaw<{ count: number; lastRequest: bigint }[]>`
    INSERT INTO "rateLimit" (id, key, count, "lastRequest") VALUES (${key}, ${key}, 1, ${now})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN "rateLimit"."lastRequest" < ${now - windowMs} THEN 1 ELSE "rateLimit".count + 1 END,
      "lastRequest" = CASE WHEN "rateLimit"."lastRequest" < ${now - windowMs} THEN ${now} ELSE "rateLimit"."lastRequest" END
    RETURNING count, "lastRequest"`;
  const { count, lastRequest } = rows[0];
  if (count > opts.max) return { ok: false, retryAfter: Math.ceil((Number(lastRequest) + windowMs - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}
