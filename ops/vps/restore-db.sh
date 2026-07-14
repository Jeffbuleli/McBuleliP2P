#!/usr/bin/env bash
# Restore a pg_dump -Fc file into the local docker compose `db` service.
# WARNING: replaces database contents.
# Usage:
#   ./ops/vps/restore-db.sh ./backups/mcbuleli_YYYYMMDD_HHMMSS.dump
set -euo pipefail

DUMP="${1:-}"
if [[ -z "$DUMP" || ! -f "$DUMP" ]]; then
  echo "Usage: $0 <path-to.dump>" >&2
  exit 1
fi

BYTES=$(wc -c <"$DUMP" | tr -d ' ')
if [[ "$BYTES" -lt 1000 ]]; then
  echo "ERROR: dump is only ${BYTES} bytes — refusing (empty file?)." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_DIR="$ROOT/ops/vps"
cd "$COMPOSE_DIR"

# shellcheck disable=SC1091
[[ -f .env ]] && set -a && . ./.env && set +a

USER="${POSTGRES_USER:-mcbuleli}"
DB="${POSTGRES_DB:-mcbuleli}"

echo "==> Ensuring db is up"
docker compose up -d db
docker compose exec -T db pg_isready -U "$USER" -d "$DB"

echo "==> Drop & recreate database $DB (connected via postgres)"
docker compose exec -T db psql -U "$USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS $DB;
CREATE DATABASE $DB OWNER $USER;
SQL

echo "==> pg_restore → $DB"
docker compose exec -T db pg_restore -U "$USER" -d "$DB" --no-owner --no-acl <"$DUMP" \
  || echo "WARN: pg_restore exited non-zero (often OK with --no-owner partial notices)"

echo "==> Sanity counts"
docker compose exec -T db psql -U "$USER" -d "$DB" -c "\dt" | head -40
echo "Done."
