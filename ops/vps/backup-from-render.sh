#!/usr/bin/env bash
# Dump Render (or any remote) Postgres to ./backups/
# Usage:
#   ./ops/vps/backup-from-render.sh "postgresql://user:pass@host/db?sslmode=require"
# Or with env:
#   DATABASE_URL=... ./ops/vps/backup-from-render.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="${BACKUP_DIR:-$ROOT/backups}"
mkdir -p "$OUT_DIR"

URL="${1:-${DATABASE_URL:-}}"
if [[ -z "$URL" ]]; then
  echo "Usage: $0 <DATABASE_URL>" >&2
  echo "  Get External Database URL from Render → Postgres → Connect" >&2
  exit 1
fi

STAMP="$(date -u +%Y%m%d_%H%M%S)"
OUT="$OUT_DIR/mcbuleli_${STAMP}.dump"

echo "==> pg_dump -Fc → $OUT"
pg_dump -Fc --no-owner --no-acl "$URL" -f "$OUT"

BYTES=$(wc -c <"$OUT" | tr -d ' ')
if [[ "$BYTES" -lt 1000 ]]; then
  echo "ERROR: dump is only ${BYTES} bytes — abort (likely empty/failed)." >&2
  rm -f "$OUT"
  exit 1
fi

echo "OK: $OUT ($(numfmt --to=iec "$BYTES" 2>/dev/null || echo "${BYTES} bytes"))"
ls -lh "$OUT"
