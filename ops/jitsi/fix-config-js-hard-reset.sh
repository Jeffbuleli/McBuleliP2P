#!/bin/bash
# Reset config.js — répare le bloc subdomain CASSÉ (substr sans .join qui suit).
# Note: subdomain.substr + .join = NORMAL dans Jitsi. startsWith('<!--') = NORMAL (SSI).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
MUC="conference.${DOMAIN}"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"
BACKUP_DIR="/root/nginx-backups"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$MEET_CFG" ]] || { echo "Missing $MEET_CFG"; exit 1; }

py_check() {
  python3 - "$1" <<'PY'
import re, sys
text = open(sys.argv[1]).read()
# Cassé: substr.split('.') puis directement if (subdomain.startsWith ou bosh: sans .join
m = re.search(
    r"subdomain = subdomain\.substr\(0, subdomain\.length - 1\)\.split\('\.'\)\s*\n(\s*)(\S)",
    text,
)
if m:
    nxt = m.group(2)
    if nxt.startswith(".join") or m.group(1).strip().startswith("."):
        print("OK_SUBSTR")
        sys.exit(1)
    print("BROKEN_SUBSTR")
    sys.exit(0)
# muc commenté dans hosts
if re.search(r"//\s*muc:\s*'conference\.'", text):
    print("BROKEN_MUC")
    sys.exit(0)
print("OK")
sys.exit(1)
PY
}

echo "==> 1. Analyse subdomain.substr"
CHK="$(py_check "$MEET_CFG" || true)"
echo "    État: ${CHK:-OK}"

if [[ "$CHK" == BROKEN_* ]] || ! node --check "$MEET_CFG" 2>/dev/null; then
  cp -a "$MEET_CFG" "${MEET_CFG}.broken.$(date +%Y%m%d%H%M%S)"
  RESTORED=""
  # Plus ancien backup d'abord (avant nos sed)
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    node --check "$f" 2>/dev/null || continue
    R="$(py_check "$f" || true)"
    [[ "$R" == BROKEN_* ]] && continue
    cp -a "$f" "$MEET_CFG"
    RESTORED="$f"
    echo "Restauré: $f"
    break
  done < <(ls -tr "$BACKUP_DIR"/*config.js* 2>/dev/null)
fi

echo ""
echo "==> 2. Réparation bloc subdomain cassé (si besoin)"
python3 - "$MEET_CFG" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path).read()

# Cas vu en prod: if (subdomain) { substr...split sans .join puis if (startsWith ou bosh
text2 = re.sub(
    r"if \(subdomain\) \{\s*\n\s*subdomain = subdomain\.substr\(0, subdomain\.length - 1\)\.split\('\.'\)\s*\n",
    "",
    text,
)
# Dé-commenter muc dans hosts
text2 = re.sub(
    r"(?m)^(\s*)// (muc:\s*'conference\.'\s*\+\s*subdomain\s*\+.*)$",
    r"\1\2",
    text2,
)
if text2 != text:
    open(path, "w").write(text2)
    print("OK: removed broken if(subdomain){substr block")
else:
    print("SKIP: no broken block to remove")
PY

echo ""
echo "==> 3. Overrides fin de fichier"
MARKER="mcbuleli-hard-reset"
python3 - "$MEET_CFG" "$DOMAIN" "$MUC" "$MARKER" <<'PY'
import re, sys
path, domain, muc, marker = sys.argv[1:5]
text = open(path).read()
text = re.sub(r'\n// mcbuleli-(?:emergency-overrides|hard-reset|same-room|muc-fixed|bosh-fix|emergency-overrides)[\s\S]*?(?=\n// |\Z)', '\n', text)
if marker not in text:
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
systemctl reload nginx 2>/dev/null || true

echo ""
echo "==> 4. Vérification"
node --check "$MEET_CFG" && echo "OK node --check"
echo "--- contexte substr (doit avoir .join juste après si substr présent) ---"
grep -n -A3 'subdomain\.substr' "$MEET_CFG" || echo "(pas de substr — OK aussi)"
FINAL="$(py_check "$MEET_CFG" || true)"
if [[ "$FINAL" == BROKEN_* ]]; then
  echo "ECHEC: bloc substr encore cassé"
  exit 1
fi
echo "OK: subdomain.substr sain ou absent"
