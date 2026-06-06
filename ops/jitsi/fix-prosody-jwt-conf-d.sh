#!/bin/bash
# Prosody charge conf.d/ — apply-jitsi-jwt patchait parfois conf.avail seulement.
# Copie JWT (token auth + muc token_verification) vers le fichier ACTIF conf.d.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CFG_D="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
CFG_A="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

if [[ -f /root/.mcbuleli-jitsi-secret ]]; then
  export JITSI_JWT_SECRET="$(tr -d '[:space:]' < /root/.mcbuleli-jitsi-secret)"
  export JITSI_APP_ID="${JITSI_APP_ID:-mcbuleli_live}"
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  bash "$SCRIPT_DIR/apply-jitsi-jwt.sh" || true
fi

[[ -f "$CFG_D" ]] || { echo "ERREUR: $CFG_D absent"; exit 1; }

# Si avail plus récent / contient token et pas conf.d — sync
if [[ -f "$CFG_A" ]] && ! grep -q 'authentication = "token"' "$CFG_D" 2>/dev/null; then
  echo "==> Sync conf.avail → conf.d (JWT manquant dans conf.d)"
  cp -a "$CFG_A" "$CFG_D"
fi

echo "==> Fichier ACTIF: $CFG_D"
grep -nE 'authentication|app_id|app_secret|token_verification|enable_domain_verification' "$CFG_D" | head -20

prosodyctl check config 2>&1 | tail -8 || true
systemctl restart prosody
sleep 3
echo "OK — JWT sur conf.d"
