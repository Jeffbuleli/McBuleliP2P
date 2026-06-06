#!/bin/bash
# config.js cassé (subdomain / syntaxe) → restaure backup valide + overrides en fin de fichier UNIQUEMENT.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
MUC="conference.${DOMAIN}"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"
BACKUP_DIR="/root/nginx-backups"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

check_cfg() {
  command -v node >/dev/null 2>&1 && node --check "$1" 2>/dev/null
}

is_corrupt() {
  local f="$1"
  grep -qE 'if \(subdomain\) \{.*substr.*split' "$f" 2>/dev/null && return 0
  check_cfg "$f" || return 0
  return 1
}

echo "==> 1. État actuel"
echo "    Note: if (subdomain.startsWith('<!--')) seul = normal (SSI Jitsi)"
if ! is_corrupt "$MEET_CFG"; then
  echo "OK: structure saine — pas de restauration"
else
  echo "ECHEC syntaxe actuelle:"
  node --check "$MEET_CFG" 2>&1 | head -5 || true
  cp -a "$MEET_CFG" "${MEET_CFG}.broken.$(date +%Y%m%d%H%M%S)"
  RESTORED=""
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    is_corrupt "$f" && continue
    if check_cfg "$f"; then
      cp -a "$f" "$MEET_CFG"
      RESTORED="$f"
      echo "Restauré: $f"
      break
    fi
  done < <(ls -t "$BACKUP_DIR"/*config.js* 2>/dev/null; ls -t /usr/share/jitsi-meet/config.js 2>/dev/null)
  if [[ -z "$RESTORED" ]]; then
    echo "ERREUR: aucun backup valide — lancez apply-mcbuleli-brand.sh"
    exit 1
  fi
fi

echo ""
echo "==> 2. Overrides McBuleli (fin de fichier seulement — ne pas toucher var config)"
MARKER="mcbuleli-emergency-overrides"
python3 - "$MEET_CFG" "$DOMAIN" "$MUC" "$MARKER" <<'PY'
import re, sys
path, domain, muc, marker = sys.argv[1:5]
text = open(path).read()
# Retirer anciens blocs mcbuleli-* en fin (évite doublons)
text = re.sub(r'\n// mcbuleli-[\w-]+[\s\S]*?(?=\n// mcbuleli-|\Z)', '\n', text)
text = re.sub(rf'\n// {re.escape(marker)}[\s\S]*$', '\n', text)
text = text.rstrip() + f"""

// {marker}
config.bosh = 'https://{domain}/http-bind';
config.websocket = 'wss://{domain}/xmpp-websocket';
config.hosts = config.hosts || {{}};
config.hosts.domain = '{domain}';
config.hosts.muc = '{muc}';
delete config.hosts.anonymousdomain;
delete config.hiddenDomain;
config.enableLobby = false;
config.disableLobby = true;
config.enableUserRolesBasedOnToken = false;
config.prejoinPageEnabled = false;
config.prejoinConfig = {{ enabled: false }};
config.transcription = {{ disabled: true }};
"""
open(path, "w").write(text)
print("OK overrides")
PY

node --check "$MEET_CFG"
bash "$SCRIPT_DIR/fix-jitsi-config-syntax.sh" 2>/dev/null || true
systemctl reload nginx 2>/dev/null || true

echo ""
echo "==> 3. Vérification servie"
curl -s "https://${DOMAIN}/config.js" | grep -iE 'subdomain\.startsWith|<!--|bosh|websocket' | head -8
node --check "$MEET_CFG" && echo "OK syntaxe locale"
