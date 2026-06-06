#!/bin/bash
# Diagnostic + resync JWT Prosody ↔ Render (fix « Authentication failed »).
# Usage:
#   export JITSI_JWT_SECRET='identique à Render JITSI_JWT_SECRET'
#   bash ops/jitsi/verify-prosody-jwt.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
APP_ID="${JITSI_APP_ID:-mcbuleli_live}"

CFG=""
for d in /etc/prosody/conf.d /etc/prosody/conf.avail; do
  [[ -f "$d/${DOMAIN}.cfg.lua" ]] && CFG="$d/${DOMAIN}.cfg.lua" && break
done

echo "==> McBuleli JWT diagnostic ($DOMAIN)"
if [[ -n "$CFG" ]]; then
  echo "Fichier: $CFG"
  grep -nE 'VirtualHost|authentication|app_id|app_secret|allow_empty_token|token_verification' "$CFG" \
    | grep -v '^\s*--' || true
else
  echo "ERREUR: Prosody config introuvable pour $DOMAIN" >&2
fi

echo ""
echo "==> Render (Dashboard → Environment) doit avoir EXACTEMENT:"
echo "  JITSI_APP_ID=$APP_ID"
echo "  JITSI_JWT_SECRET=<même valeur que app_secret Prosody ci-dessus>"
echo "  JITSI_JWT_SUB=$DOMAIN"
echo "  NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL=https://$DOMAIN"

SECRET_FILE="/root/.mcbuleli-jitsi-secret"
if [[ -z "${JITSI_JWT_SECRET:-}" && -f "$SECRET_FILE" ]]; then
  JITSI_JWT_SECRET="$(tr -d '[:space:]' < "$SECRET_FILE")"
  export JITSI_JWT_SECRET
  echo ""
  echo "==> Secret chargé depuis $SECRET_FILE"
fi

if [[ -z "${JITSI_JWT_SECRET:-}" || ${#JITSI_JWT_SECRET} -lt 16 ]]; then
  echo ""
  echo "Pour resynchroniser Prosody:"
  echo "  echo 'VOTRE_SECRET_RENDER' > $SECRET_FILE && chmod 600 $SECRET_FILE"
  echo "  export JITSI_JWT_SECRET=\$(cat $SECRET_FILE)"
  echo "  bash ops/jitsi/apply-jitsi-jwt.sh"
  exit 1
fi

echo ""
echo "==> Resync Prosody avec JITSI_APP_ID=$APP_ID"
export JITSI_APP_ID
bash "$SCRIPT_DIR/apply-jitsi-jwt.sh"

echo ""
echo "OK — Retestez depuis l'app : Rejoindre le live → Rejoindre la réunion (Jitsi)"
