import "dotenv/config";
import { defineConfig } from "prisma/config";
import { applyEnvFallbacks, cleanDatabaseUrl } from "./src/lib/env-fallbacks";

applyEnvFallbacks(process.env);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrations need a direct/session connection (Supabase port 5432); the app itself can use the
  // transaction pooler (port 6543) in DATABASE_URL. Locally both are the same database.
  // `prisma generate` (run on every install) doesn't need a database, so a missing URL must not
  // break installation; `migrate deploy` still fails clearly, after scripts/check-env.ts has listed
  // every missing setting.
  datasource: {
    url: cleanDatabaseUrl(process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://missing-database-url/none"),
  },
});
