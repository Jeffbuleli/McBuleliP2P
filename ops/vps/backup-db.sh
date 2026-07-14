#!/usr/bin/env bash
# Daily backup of VPS Postgres (docker compose service `db`).
# Retention: 14 daily dumps.
set -euo pipefail

ROOT="${MCBULELI_REPO:-/opt/mcbuleli}"
COMPOSE_DIR="$ROOT/ops/vps"
OUT_DIR="${BACKUP_DIR:-/var/backups/mcbuleli}"
KEEP="${BACKUP_KEEP:-14}"
STAMP="$(date -u +%Y%m%d_%H%M%S)"
OUT="$OUT_DIR/mcbuleli_${STAMP}.dump"

mkdir -p "$OUT_DIR"
cd "$COMPOSE_DIR"

echo "[$(date -u +%FT%TZ)] dumping → $OUT"
docker compose exec -T db pg_dump -U "${POSTGRES_USER:-mcbuleli}" -Fc "${POSTGRES_DB:-mcbuleli}" >"$OUT"

BYTES=$(wc -c <"$OUT" | tr -d ' ')
if [[ "$BYTES" -lt 1000 ]]; then
  echo "ERROR: dump too small (${BYTES} B)" >&2
  rm -f "$OUT"
  exit 1
fi

# Retention
ls -1t "$OUT_DIR"/mcbuleli_*.dump 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm -f
echo "[$(date -u +%FT%TZ)] OK ${BYTES} bytes (keep=$KEEP)"
