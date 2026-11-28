import { cleanDatabaseUrl } from "./env-fallbacks";

/**
 * node-postgres connection settings shared by the app (src/server/db.ts) and CLI scripts.
 *
 * TLS for hosted Postgres: Supabase's server certificates are signed by Supabase's own CA, which
 * Node doesn't trust by default. If DATABASE_SSL_CA (the PEM from Supabase → Database → SSL
 * Configuration) is set, the certificate is fully verified; otherwise the connection is still
 * encrypted but the certificate isn't verified. Local databases use no TLS.
 */
export function pgConnection(rawUrl: string, caPem = process.env.DATABASE_SSL_CA) {
  const cleaned = cleanDatabaseUrl(rawUrl);
  let u: URL;
  try {
    u = new URL(cleaned);
  } catch {
    return { connectionString: cleaned };
  }
  if (["localhost", "127.0.0.1", "::1"].includes(u.hostname)) return { connectionString: cleaned };
  u.searchParams.delete("sslmode"); // handled explicitly (node-postgres would otherwise force full verification)
  const ca = caPem?.replace(/\\n/g, "\n");
  return { connectionString: u.toString(), ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false } };
}
