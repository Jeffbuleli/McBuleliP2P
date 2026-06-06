#!/bin/bash
# muc: 'conference.' + subdomain + 'live...' (template Jitsi) → MUC différente si subdomain ≠ ''.
# McBuleli : une seule MUC fixe conference.live.mcbuleli.org pour host + invités.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
MUC="conference.${DOMAIN}"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$MEET_CFG" ]] || { echo "Missing $MEET_CFG"; exit 1; }

cp -a "$MEET_CFG" "/root/nginx-backups/$(basename "$MEET_CFG").muc-fix.$(date +%Y%m%d%H%M%S)"

python3 - "$MEET_CFG" "$DOMAIN" "$MUC" <<'PY'
import re, sys

path, domain, muc = sys.argv[1:4]
text = open(path).read()

# Forcer subdomain vide (évite conference.<tenant>.live...)
text = re.sub(
    r"(?m)^(\s*)var\s+subdomain\s*=.*$",
    r"\1var subdomain = '';",
    text,
    count=1,
)
if "var subdomain" not in text:
    text = "var subdomain = '';\n" + text

# Ne PAS commenter dans var config = { } — risque SyntaxError. Overrides en fin de fichier seulement.

marker = "mcbuleli-muc-fixed"
if marker not in text:
    text += f"""

// {marker} — MUC unique (pas de subdomain)
config.hosts = config.hosts || {{}};
config.hosts.domain = '{domain}';
config.hosts.muc = '{muc}';
"""
else:
    # Réécrire la ligne muc du marker si déjà présent
    text = re.sub(
        rf"(?m)^config\.hosts\.muc = .*?;\s*// {re.escape(marker)}",
        f"config.hosts.muc = '{muc}'; // {marker}",
        text,
    )

open(path, "w").write(text)
print("OK")
PY

node --check "$MEET_CFG"
systemctl reload nginx 2>/dev/null || true

echo "==> grep muc (attendu: subdomain='', pas de + subdomain +)"
grep -nE 'subdomain|hosts\.muc|muc:.*conference' "$MEET_CFG" | grep -v '// enableLobbyChat' | tail -12

echo ""
echo "==> config.js servi"
curl -s "https://${DOMAIN}/config.js" | grep -iE 'subdomain|hosts\.muc|muc:.*conference' | head -8
