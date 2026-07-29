#!/usr/bin/env bash
# Fix IA Académie / CHK affiliation (contact + badge seats).
set -euo pipefail

REPO="${MCBULELI_REPO:-/opt/mcbuleli}"
COMPOSE_DIR="${MCBULELI_COMPOSE_DIR:-$REPO/ops/vps}"
APPLY="${1:---apply}"

cd "$COMPOSE_DIR"

WEB="$(docker compose ps -q web)"
NET="$(docker inspect "$WEB" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')"
DBURL="$(docker compose exec -T web printenv DATABASE_URL | tr -d '\r')"

docker run --rm --network "$NET" \
  -v "$REPO:/app" \
  -v mcbuleli_email_node_modules:/app/node_modules \
  -w /app \
  -e "DATABASE_URL=$DBURL" \
  node:22-bookworm-slim \
  bash -lc "npx tsx scripts/fix-ia-academie-affiliation.ts $APPLY"

echo "==> done"
