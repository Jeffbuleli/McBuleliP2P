#!/usr/bin/env bash
# NGEMBA Bloc B smoke - alerte + prise en charge ops (à lancer sur le VPS).
#
# Usage:
#   bash /opt/ngemba/ops/vps/bloc-b-smoke.sh
#
set -euo pipefail

COMPOSE_DIR="${NGEMBA_COMPOSE_DIR:-/opt/ngemba/ops/vps}"
ENV_FILE="$COMPOSE_DIR/.env"
BASE="${NGEMBA_SMOKE_URL:-http://127.0.0.1:3012}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: missing $ENV_FILE" >&2
  exit 1
fi

read_env() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r' | sed 's/^["'\''"]//;s/["'\''"]$//' || true
}

ADMIN_TOKEN="$(read_env NGEMBA_OPS_TOKEN_ADMIN)"
if [[ -z "$ADMIN_TOKEN" ]]; then
  ADMIN_TOKEN="$(read_env NGEMBA_OPS_TOKEN)"
fi
if [[ -z "$ADMIN_TOKEN" ]]; then
  echo "ERROR: NGEMBA_OPS_TOKEN or NGEMBA_OPS_TOKEN_ADMIN required" >&2
  exit 1
fi

echo "==> Health"
curl -sf "$BASE/api/health" | head -c 200
echo

echo "==> Create pilot alert (B1/B8)"
CREATE=$(curl -sf -X POST "$BASE/api/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "[PILOTE BLOC B] Test McBuleli - verification flux alerte et prise en charge ops. Situation simulee VBG Kinshasa.",
    "locale": "fr",
    "source": "sos_button",
    "provinceId": "kinshasa",
    "cityId": "gombe"
  }') || {
  echo "ERROR: alert create failed" >&2
  exit 1
}
SESSION_ID=$(echo "$CREATE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
if [[ -z "$SESSION_ID" ]]; then
  echo "ERROR: could not parse session id from: $CREATE" >&2
  exit 1
fi
echo "Session: $SESSION_ID"

echo "==> Ops auth (admin)"
COOKIE_JAR=$(mktemp)
trap 'rm -f "$COOKIE_JAR"' EXIT
curl -sf -X POST "$BASE/api/ops/auth" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -d "{\"token\":\"$ADMIN_TOKEN\"}" >/dev/null

echo "==> Take charge + close (B8)"
PATCH=$(curl -sf -X PATCH "$BASE/api/alerts/$SESSION_ID" \
  -b "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "oriented",
    "assignedTo": "McBuleli - test pilote Bloc B",
    "operatorNotes": "Alerte test Bloc B - prise en charge simulee. Email info@ngemba-rdc.org a verifier."
  }') || {
  echo "ERROR: patch failed" >&2
  exit 1
}

if ! echo "$PATCH" | grep -q '"status":"oriented"'; then
  echo "ERROR: patch did not set oriented: $PATCH" >&2
  exit 1
fi

echo "==> Email log (last 5 lines)"
docker compose -f "$COMPOSE_DIR/docker-compose.yml" logs web --tail 30 2>/dev/null \
  | grep -E "ops email|resend" | tail -5 || echo "(no email log line - check RESEND_API_KEY)"

echo "OK - Bloc B smoke passed · session $SESSION_ID · status oriented"
