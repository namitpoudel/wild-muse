import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { pgConnection } from "@/lib/db-connection";
import { applyEnvFallbacks } from "@/lib/env-fallbacks";

/**
 * Single Prisma client per server process (avoids exhausting connections during
 * dev hot-reload). Only server code may import this module.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  applyEnvFallbacks(process.env);
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");
  // On serverless hosting each instance keeps a small pool; Supabase's pooler (port 6543) multiplexes them.
  const max = Number(process.env.DATABASE_POOL_MAX ?? (process.env.NODE_ENV === "production" ? 5 : 10));
  return new PrismaClient({ adapter: new PrismaPg({ ...pgConnection(raw), max, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 }) });
}

export const db = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
