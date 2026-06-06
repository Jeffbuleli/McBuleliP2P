#!/bin/bash
# Reset config.js quand subdomain/subdir ou var config = { } est cassé.
# Les lignes if (subdomain.startsWith('<!--')) sont NORMALES en Jitsi (SSI nginx).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
MUC="conference.${DOMAIN}"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"
BACKUP_DIR="/root/nginx-backups"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$MEET_CFG" ]] || { echo "Missing $MEET_CFG"; exit 1; }

is_corrupt() {
  local f="$1"
  # Bloc subdomain cassé par nos scripts (substr + split sans fermeture)
  grep -qE 'if \(subdomain\) \{.*substr.*split' "$f" 2>/dev/null && return 0
  grep -qE 'muc:.*//.*conference\.' "$f" 2>/dev/null && return 0
  command -v node >/dev/null 2>&1 || return 1
  node --check "$f" 2>/dev/null || return 0
  return 1
}

echo "==> 1. Détection corruption"
if is_corrupt "$MEET_CFG"; then
  echo "CORROMPU — recherche backup sain"
  cp -a "$MEET_CFG" "${MEET_CFG}.broken.$(date +%Y%m%d%H%M%S)"
else
  echo "Structure OK (startsWith('<!--') seul = normal Jitsi SSI)"
fi

RESTORED=""
while IFS= read -r f; do
  [[ -f "$f" ]] || continue
  is_corrupt "$f" && continue
  command -v node >/dev/null 2>&1 && node --check "$f" 2>/dev/null || continue
  cp -a "$f" "$MEET_CFG"
  RESTORED="$f"
  echo "Restauré depuis: $f"
  break
done < <(ls -t "$BACKUP_DIR"/*config.js* 2>/dev/null)

if [[ -z "$RESTORED" ]] && is_corrupt "$MEET_CFG"; then
  echo "==> 2. Réparation in-place (pas de backup sain)"
  python3 - "$MEET_CFG" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path).read()
# Supprimer if (subdomain) { substr... cassé
text = re.sub(
    r"if \(subdomain\) \{[^}]*\.substr\([^)]*\)[^}]*",
    "",
    text,
    flags=re.DOTALL,
)
# Dé-commenter muc si commenté dans hosts
text = re.sub(
    r"(?m)^(\s*)// (muc:\s*'conference\.'\s*\+\s*subdomain\s*\+.*)$",
    r"\1\2",
    text,
)
open(path, "w").write(text)
print("OK repair in-place")
PY
fi

echo ""
echo "==> 3. Overrides fin de fichier (jamais dans var config)"
MARKER="mcbuleli-hard-reset"
python3 - "$MEET_CFG" "$DOMAIN" "$MUC" "$MARKER" <<'PY'
import re, sys
path, domain, muc, marker = sys.argv[1:5]
text = open(path).read()
text = re.sub(r'\n// mcbuleli-(?:emergency-overrides|hard-reset|same-room|muc-fixed|bosh-fix)[\s\S]*?(?=\n// config\.|$)', '\n', text)
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
"""
open(path, "w").write(text)
PY

node --check "$MEET_CFG"
bash "$SCRIPT_DIR/fix-jitsi-config-syntax.sh" 2>/dev/null || true
systemctl reload nginx

echo ""
echo "==> 4. Vérification"
node --check "$MEET_CFG" && echo "OK node --check"
if is_corrupt "$MEET_CFG"; then
  echo "ECHEC: encore corrompu — essayez: apt install --reinstall jitsi-meet"
  exit 1
fi
echo "OK: pas de bloc subdomain.substr cassé"
curl -s "https://${DOMAIN}/config.js" | head -30 | tail -15
