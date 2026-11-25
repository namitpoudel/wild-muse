#!/usr/bin/env bash
# Restore a backup made by scripts/backup-db.sh into a database.
#
#   npm run db:restore -- backups/wildmuse-20261125-120000.dump "postgresql://user:pw@host:5432/db"
#
# The target's "public" schema is REPLACED. Practise on a spare database first (see docs/07).
# Restoring over the live database requires typing the database host to confirm.
set -euo pipefail
FILE="${1:-}"; TARGET="${2:-}"
[ -f "$FILE" ] && [ -n "$TARGET" ] || { echo "Usage: restore-db.sh <backup.dump|backup.dump.gpg> <target-database-url>" >&2; exit 1; }
TARGET="${TARGET%%\?*}"

if [[ "$FILE" == *.gpg ]]; then
  PLAIN="$(mktemp)"
  gpg --batch --decrypt --output "$PLAIN" "$FILE"
  FILE="$PLAIN"
fi

HOST="$(echo "$TARGET" | sed -E 's#^[a-z]+://([^@]*@)?([^:/]+).*#\2#')"
if [ -t 0 ] && [ "${RESTORE_CONFIRM:-}" != "$HOST" ]; then
  read -r -p "This REPLACES all shop data on '$HOST'. Type the host name to continue: " ANSWER
  [ "$ANSWER" = "$HOST" ] || { echo "Cancelled."; exit 1; }
elif [ ! -t 0 ] && [ "${RESTORE_CONFIRM:-}" != "$HOST" ]; then
  echo "Non-interactive restore: set RESTORE_CONFIRM=$HOST to confirm." >&2; exit 1
fi

# Fresh schema + the extensions the migrations use (pg_trgm powers search), then everything else
# from the backup except the schema/extension entries we just created.
psql "$TARGET" -v ON_ERROR_STOP=1 -q -c 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS pg_trgm;'
LIST="$(mktemp)"; trap 'rm -f "$LIST" "${PLAIN:-}"' EXIT
pg_restore --list "$FILE" | grep -vE '^[0-9]+; [0-9]+ [0-9]+ (SCHEMA|EXTENSION|COMMENT - EXTENSION) ' > "$LIST"
pg_restore --dbname="$TARGET" --no-owner --no-acl --exit-on-error --use-list="$LIST" "$FILE"
echo "Restored into $HOST. Orders: $(psql "$TARGET" -tAc 'select count(*) from "Order"'), products: $(psql "$TARGET" -tAc 'select count(*) from "Product"')."
