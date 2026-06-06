#!/bin/bash
# Diagnostic « Authentication failed » — à lancer sur le VPS (root).
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"

echo "==> 1. VirtualHost token (live.mcbuleli.org)"
grep -nE 'VirtualHost|authentication|app_id|app_secret|allow_empty_token' "$CFG" \
  | grep -v 'auth\.live\|recorder\.live' || true

echo ""
echo "==> 2. MUC conference + token_verification"
grep -nE 'Component "conference|token_verification|modules_enabled' "$CFG" | head -30

echo ""
echo "==> 3. Longueur app_secret Prosody (Render = 64 si openssl rand -hex 32)"
python3 - "$CFG" <<'PY'
import re, sys
text = open(sys.argv[1]).read()
m = re.search(r'VirtualHost "live\.mcbuleli\.org".*?app_secret\s*=\s*"([^"]*)"', text, re.DOTALL)
if not m:
    print("ERREUR: app_secret introuvable dans VirtualHost live")
    sys.exit(1)
secret = m.group(1)
print(f"Longueur: {len(secret)} caractères")
print(f"Début: {secret[:6]}…  Fin: …{secret[-6:]}")
PY

echo ""
echo "==> 4. config.js JWT roles"
grep -n 'enableUserRolesBasedOnToken' /etc/jitsi/meet/${DOMAIN}-config.js 2>/dev/null || echo "absent"

echo ""
echo "==> 5. Derniers logs Prosody (token / auth)"
journalctl -u prosody -n 80 --no-pager 2>/dev/null \
  | grep -iE 'token|auth|jwt|forbidden|not allowed|signature' || echo "(aucune ligne token récente)"

echo ""
echo "==> 6. Test live : ouvrez le live depuis l'app, cliquez Rejoindre, puis relancez:"
echo "    journalctl -u prosody -n 30 --no-pager | tail -20"
echo ""
echo "Si allow_empty_token ou token_verification manquent:"
echo "  export JITSI_JWT_SECRET=\$(grep app_secret $CFG | sed 's/.*\"\\(.*\\)\".*/\\1/')"
echo "  bash ops/jitsi/apply-jitsi-jwt.sh"
