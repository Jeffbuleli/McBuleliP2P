#!/usr/bin/env bash
# Apply a drizzle/*.sql migration to the VPS Postgres (docker compose `db`).
# Usage (on the VPS, from repo root or ops/vps):
#   bash ops/vps/apply-drizzle-sql.sh drizzle/0121_hackathon_lead_gen.sql
set -euo pipefail

REPO="${MCBULELI_REPO:-/opt/mcbuleli}"
COMPOSE_DIR="${MCBULELI_COMPOSE_DIR:-$REPO/ops/vps}"
SQL_REL="${1:?usage: apply-drizzle-sql.sh <path-to.sql>}"

if [[ "$SQL_REL" = /* ]]; then
  SQL_ABS="$SQL_REL"
else
  SQL_ABS="$REPO/$SQL_REL"
fi

if [[ ! -f "$SQL_ABS" ]]; then
  echo "ERROR: SQL file not found: $SQL_ABS" >&2
  exit 1
fi

cd "$COMPOSE_DIR"
USER_NAME="${POSTGRES_USER:-mcbuleli}"
DB_NAME="${POSTGRES_DB:-mcbuleli}"

echo "==> Applying $(basename "$SQL_ABS") → ${USER_NAME}@${DB_NAME}"
docker compose exec -T db \
  psql -U "$USER_NAME" -d "$DB_NAME" -v ON_ERROR_STOP=1 \
  < "$SQL_ABS"

echo "==> OK"
