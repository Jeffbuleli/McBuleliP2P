#!/bin/bash
# Restaure live.mcbuleli.org-config.js depuis backup valide + réapplique branding.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFIG="/etc/jitsi/meet/${DOMAIN}-config.js"
BACKUP_DIR="/root/nginx-backups"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

check_cfg() {
  command -v node >/dev/null 2>&1 && node --check "$1" 2>/dev/null
}

if check_cfg "$CONFIG"; then
  echo "OK: $CONFIG déjà valide"
  exit 0
fi

echo "ECHEC actuel:"
node --check "$CONFIG" 2>&1 | head -4 || true

cp -a "$CONFIG" "${CONFIG}.broken.$(date +%Y%m%d%H%M%S)"

RESTORED=""
# Préférer le plus gros backup (souvent avant awk/sed cassant)
while IFS= read -r f; do
  [[ -f "$f" ]] || continue
  if check_cfg "$f"; then
    cp -a "$f" "$CONFIG"
    RESTORED="$f"
    break
  fi
done < <(ls -tS "$BACKUP_DIR"/*config.js* 2>/dev/null; ls -tS /root/*config.js*bak* 2>/dev/null)

if [[ -z "$RESTORED" ]]; then
  echo "Aucun backup ne passe node --check — restauration du plus volumineux quand même"
  BEST="$(ls -S "$BACKUP_DIR"/*config.js* 2>/dev/null | head -1 || true)"
  [[ -n "$BEST" ]] && cp -a "$BEST" "$CONFIG" && RESTORED="$BEST"
fi

echo "Restauré: ${RESTORED:-RIEN}"

bash "$SCRIPT_DIR/fix-jitsi-config-syntax.sh"
bash "$SCRIPT_DIR/apply-mcbuleli-brand.sh"

node --check "$CONFIG"
echo "OK — Ctrl+Shift+R sur https://${DOMAIN}/test-live-mcbuleli (depuis l'app)"
