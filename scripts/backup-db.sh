#!/usr/bin/env bash
# Back up the WILD MUSE database (all shop data lives in the "public" schema).
#
#   npm run db:backup                       → ./backups/wildmuse-<date>.dump
#   BACKUP_PASSPHRASE=... npm run db:backup → also encrypts it (…dump.gpg) and deletes the plain file
#
# Connection: BACKUP_DATABASE_URL, else DIRECT_URL, else DATABASE_URL (from the environment or .env).
# For Supabase use the direct/session connection string (port 5432), not the 6543 pooler.
# The dump contains customer personal data: store it encrypted and never commit it (backups/ is gitignored).
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .env ]; then set -a; . ./.env; set +a; fi
URL="${BACKUP_DATABASE_URL:-${DIRECT_URL:-${DATABASE_URL:-}}}"
[ -n "$URL" ] || { echo "No database URL set (BACKUP_DATABASE_URL / DIRECT_URL / DATABASE_URL)." >&2; exit 1; }
URL="${URL%%\?*}"   # pg_dump doesn't understand Prisma's ?schema= parameter

mkdir -p backups
OUT="backups/wildmuse-$(date -u +%Y%m%d-%H%M%S).dump"
pg_dump "$URL" --format=custom --compress=9 --schema=public --no-owner --no-acl --file="$OUT"
pg_restore --list "$OUT" > /dev/null   # verify the archive is readable
echo "Backup written: $OUT ($(du -h "$OUT" | cut -f1))"

if [ -n "${BACKUP_PASSPHRASE:-}" ]; then
  gpg --batch --yes --pinentry-mode loopback --passphrase "$BACKUP_PASSPHRASE" --symmetric --cipher-algo AES256 --output "$OUT.gpg" "$OUT"
  rm -f "$OUT"
  echo "Encrypted: $OUT.gpg (decrypt with: gpg --decrypt $OUT.gpg > restore.dump)"
fi
