/**
 * Fill in settings from what Vercel and its integrations already provide, so the owner doesn't have
 * to copy connection strings by hand. An explicitly set variable always wins.
 *
 *   Supabase integration → POSTGRES_PRISMA_URL / POSTGRES_URL (pooled), POSTGRES_URL_NON_POOLING (direct),
 *                          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   Resend integration   → RESEND_API_KEY
 *   Stripe integration   → STRIPE_SECRET_KEY
 *   Vercel system vars   → VERCEL_PROJECT_PRODUCTION_URL (the live address)
 *
 * Pure: mutates and returns the given env object. Called from next.config.ts (build), prisma.config.ts,
 * scripts and instrumentation.ts (server start).
 */
type Env = Record<string, string | undefined>;

/** Remove query parameters node-postgres doesn't understand (Prisma/pgbouncer flags, sslmode is handled in db.ts). */
export function cleanDatabaseUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const p of ["pgbouncer", "connection_limit", "pool_timeout", "schema", "supa"]) u.searchParams.delete(p);
    return u.toString();
  } catch {
    return url;
  }
}

export function applyEnvFallbacks<T extends Env>(env: T): T {
  const e = env as Env;
  const set = (key: string, value: string | undefined) => {
    if (!e[key] && value) e[key] = value;
  };

  set("DATABASE_URL", e.POSTGRES_PRISMA_URL || e.POSTGRES_URL);
  set("DIRECT_URL", e.POSTGRES_URL_NON_POOLING);
  set("SUPABASE_URL", e.NEXT_PUBLIC_SUPABASE_URL);

  const vercelUrl = e.VERCEL_PROJECT_PRODUCTION_URL ? `https://${e.VERCEL_PROJECT_PRODUCTION_URL}` : undefined;
  set("NEXT_PUBLIC_SITE_URL", vercelUrl);
  set("BETTER_AUTH_URL", e.NEXT_PUBLIC_SITE_URL);

  if (e.SUPABASE_URL && e.SUPABASE_SERVICE_ROLE_KEY) set("STORAGE_DRIVER", "supabase");
  if (e.RESEND_API_KEY) {
    set("EMAIL_DRIVER", "resend");
    // Resend's shared test sender: only delivers to the Resend account owner's address until a domain is verified.
    set("EMAIL_FROM", "Wild Muse <onboarding@resend.dev>");
  }
  return env;
}
