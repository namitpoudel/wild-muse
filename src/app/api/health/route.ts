import { connection } from "next/server";
import { checkProductionEnv, isLiveDeployment } from "@/lib/env-check";
import { db } from "@/server/db";

/**
 * Uptime-monitor endpoint: GET /api/health → 200 when the site and database are up, 503 otherwise.
 * Reveals no secrets and no data — only "ok"/"down" and a count of configuration problems.
 */
export async function GET() {
  await connection();
  const started = Date.now();
  let database: "ok" | "down" = "ok";
  try {
    await db.$queryRaw`select 1`;
  } catch {
    database = "down";
  }
  const configErrors = isLiveDeployment(process.env) ? checkProductionEnv(process.env).filter((i) => i.level === "error").length : 0;
  const ok = database === "ok";
  return Response.json(
    { status: ok ? (configErrors ? "degraded" : "ok") : "down", database, configErrors, ms: Date.now() - started },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
