/** Prisma client for CLI scripts (seed, create-admin, first-run setup). App code uses src/server/db.ts. */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { pgConnection } from "../src/lib/db-connection";
import { applyEnvFallbacks } from "../src/lib/env-fallbacks";

export function scriptClient() {
  applyEnvFallbacks(process.env);
  // Scripts prefer the direct connection (long-running, session features); the app uses the pooler.
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaPg(pgConnection(connectionString)) });
}
