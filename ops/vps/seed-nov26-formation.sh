#!/usr/bin/env bash
# Upsert hackathon edition nov26 (formation en ligne, 50 USD) on the VPS.
#
#   bash ops/vps/seed-nov26-formation.sh
#
set -euo pipefail

REPO="${MCBULELI_REPO:-/opt/mcbuleli}"
COMPOSE_DIR="${MCBULELI_COMPOSE_DIR:-$REPO/ops/vps}"

cd "$COMPOSE_DIR"

compose() {
  if [[ -f docker-compose.shared-host.yml ]]; then
    docker compose -f docker-compose.yml -f docker-compose.shared-host.yml "$@"
  else
    docker compose "$@"
  fi
}

WEB="$(compose ps -q web)"
if [[ -z "$WEB" ]]; then
  echo "ERROR: web container not running" >&2
  exit 1
fi

NET="$(docker inspect "$WEB" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')"
DBURL="$(compose exec -T web printenv DATABASE_URL | tr -d '\r')"

echo "==> $(date -u +%Y-%m-%dT%H:%M:%SZ) seed nov26 formation edition"
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
    npx tsx scripts/seed-nov26-formation.ts
  "

echo "==> done — verify https://mcbuleli.com/nov26"
