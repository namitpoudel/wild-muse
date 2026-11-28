import { describe, expect, it } from "vitest";
import { pgConnection } from "./db-connection";
import { applyEnvFallbacks, cleanDatabaseUrl } from "./env-fallbacks";

describe("settings from Vercel integrations", () => {
  it("fills database, storage, email and site address from integration variables", () => {
    const env = applyEnvFallbacks({
      POSTGRES_PRISMA_URL: "postgres://u:p@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true",
      POSTGRES_URL_NON_POOLING: "postgres://u:p@aws-0-eu-west-2.pooler.supabase.com:5432/postgres?sslmode=require",
      SUPABASE_URL: "https://abc.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "srk",
      RESEND_API_KEY: "re_x",
      VERCEL_PROJECT_PRODUCTION_URL: "wild-muse.vercel.app",
    } as Record<string, string | undefined>);
    expect(env.DATABASE_URL).toContain(":6543/");
    expect(env.DIRECT_URL).toContain(":5432/");
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://wild-muse.vercel.app");
    expect(env.BETTER_AUTH_URL).toBe("https://wild-muse.vercel.app");
    expect(env.STORAGE_DRIVER).toBe("supabase");
    expect(env.EMAIL_DRIVER).toBe("resend");
    expect(env.EMAIL_FROM).toContain("@resend.dev");
  });

  it("never overrides a value the owner set explicitly", () => {
    const env = applyEnvFallbacks({
      DATABASE_URL: "postgres://mine",
      POSTGRES_URL: "postgres://integration",
      NEXT_PUBLIC_SITE_URL: "https://wildmuse.co.uk",
      VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app",
    } as Record<string, string | undefined>);
    expect(env.DATABASE_URL).toBe("postgres://mine");
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://wildmuse.co.uk");
  });

  it("strips Prisma-only URL flags and sets TLS for hosted databases only", () => {
    expect(cleanDatabaseUrl("postgres://u:p@h:6543/db?pgbouncer=true&sslmode=require&schema=public")).toBe(
      "postgres://u:p@h:6543/db?sslmode=require",
    );
    const hosted = pgConnection("postgres://u:p@aws-0.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true", undefined);
    expect(hosted.connectionString).not.toContain("sslmode");
    expect(hosted.ssl).toEqual({ rejectUnauthorized: false });
    expect(pgConnection("postgres://u:p@h/db", "-----BEGIN CERTIFICATE-----\\nX").ssl).toEqual({
      ca: "-----BEGIN CERTIFICATE-----\nX",
      rejectUnauthorized: true,
    });
    expect(pgConnection("postgresql://u:p@localhost:5432/db?schema=public").ssl).toBeUndefined();
  });

  it("accepts integration variables with a custom prefix", () => {
    const env = applyEnvFallbacks({
      STORAGE_POSTGRES_PRISMA_URL: "postgres://u:p@pooler.supabase.com:6543/postgres",
      STORAGE_POSTGRES_URL_NON_POOLING: "postgres://u:p@pooler.supabase.com:5432/postgres",
      STORAGE_SUPABASE_URL: "https://xyz.supabase.co",
      STORAGE_SUPABASE_SERVICE_ROLE_KEY: "srk",
    } as Record<string, string | undefined>);
    expect(env.DATABASE_URL).toContain(":6543/");
    expect(env.DIRECT_URL).toContain(":5432/");
    expect(env.SUPABASE_URL).toBe("https://xyz.supabase.co");
    expect(env.STORAGE_DRIVER).toBe("supabase");
  });
});
