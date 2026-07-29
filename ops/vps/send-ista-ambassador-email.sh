#!/usr/bin/env bash
# Seed + send ISTA campus ambassador welcome (code ISTA-KIN).
# Usage:
#   bash ops/vps/send-ista-ambassador-email.sh
#   bash ops/vps/send-ista-ambassador-email.sh --to coordinationestudiantinedeista@gmail.com
set -euo pipefail

REPO="${MCBULELI_REPO:-/opt/mcbuleli}"
COMPOSE_DIR="${MCBULELI_COMPOSE_DIR:-$REPO/ops/vps}"
TO="${ISTA_AMB_TO:-coordinationestudiantinedeista@gmail.com}"

for a in "$@"; do
  if [[ "$a" == --to=* ]]; then
    TO="${a#--to=}"
  elif [[ "$a" == --to && -n "${2:-}" ]]; then
    TO="$2"
  fi
done

cd "$COMPOSE_DIR"

WEB="$(docker compose ps -q web)"
if [[ -z "$WEB" ]]; then
  echo "ERROR: web container not running" >&2
  exit 1
fi

NET="$(docker inspect "$WEB" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}')"
DBURL="$(docker compose exec -T web printenv DATABASE_URL | tr -d '\r')"
RESEND="$(docker compose exec -T web printenv RESEND_API_KEY | tr -d '\r')"
ALLOW="$(docker compose exec -T web printenv RESEND_ALLOW_SEND | tr -d '\r')"
APPURL="$(docker compose exec -T web printenv NEXT_PUBLIC_APP_URL | tr -d '\r')"

if [[ -z "$RESEND" || "$ALLOW" != "true" ]]; then
  echo "ERROR: Resend not configured (RESEND_API_KEY / RESEND_ALLOW_SEND=true)" >&2
  exit 1
fi

echo "==> $(date -u +%Y-%m-%dT%H:%M:%SZ) ista-ambassador seed + send → $TO"

docker run --rm --network "$NET" \
  -v "$REPO:/app" \
  -v mcbuleli_email_node_modules:/app/node_modules \
  -w /app \
  -e "DATABASE_URL=$DBURL" \
  -e "RESEND_API_KEY=$RESEND" \
  -e "RESEND_ALLOW_SEND=$ALLOW" \
  -e "NEXT_PUBLIC_APP_URL=$APPURL" \
  node:22-bookworm-slim \
  bash -lc "set -e
    if [ ! -f node_modules/tsx/package.json ]; then
      apt-get update -qq >/dev/null
      apt-get install -y -qq ca-certificates >/dev/null
      npm ci --ignore-scripts
    fi
    npx tsx scripts/send-ista-ambassador-email.ts --to ${TO} --send
  "

echo "==> done"
