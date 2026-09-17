#!/usr/bin/env bash
# Seed McBuleli Marché sample products (ceo@mcbuleli.org) on the VPS.
#
#   bash ops/vps/seed-eavec-mcbuleli-samples.sh
#
set -euo pipefail

REPO="${MCBULELI_REPO:-/opt/mcbuleli}"
COMPOSE_DIR="${MCBULELI_COMPOSE_DIR:-$REPO/ops/vps}"

cd "$COMPOSE_DIR"

WEB="$(docker compose ps -q web)"
if [[ -z "$WEB" ]]; then
  echo "ERROR: web container not running" >&2
  exit 1
fi

NET="$(docker inspect "$WEB" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')"
DBURL="$(docker compose exec -T web printenv DATABASE_URL | tr -d '\r')"

echo "==> $(date -u +%Y-%m-%dT%H:%M:%SZ) seed eavec mcbuleli samples"
echo "    NET=$NET"

docker run --rm --network "$NET" \
  -v "$REPO:/app" \
  -v mcbuleli_email_node_modules:/app/node_modules \
  -w /app \
  -e "DATABASE_URL=$DBURL" \
  node:22-bookworm-slim \
  bash -lc "set -e
    if [ ! -f node_modules/tsx/package.json ]; then
      apt-get update -qq >/dev/null
      apt-get install -y -qq ca-certificates >/dev/null
      npm ci --ignore-scripts
    fi
    npx tsx scripts/seed-eavec-mcbuleli-samples.ts
  "

echo "==> done"
