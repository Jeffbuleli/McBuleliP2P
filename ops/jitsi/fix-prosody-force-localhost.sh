#!/bin/bash
# 5222 encore sur 0.0.0.0 → forcer interfaces + restart Prosody + vérif PID.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
MAIN="/etc/prosody/prosody.cfg.lua"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

OLD_PID="$(pgrep -o -f 'lua.*prosody' 2>/dev/null || true)"
echo "==> PID Prosody avant: ${OLD_PID:-?}"

cp -a "$MAIN" "/root/nginx-backups/prosody.cfg.lua.force.$(date +%Y%m%d%H%M%S)"

python3 - "$MAIN" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path).read()
# Jitsi défaut: c2s_interfaces = { "*", "::1" } → écrase interfaces
for key in ("interfaces", "c2s_interfaces", "s2s_interfaces"):
    if re.search(rf'(?m)^{key}\s*=', text):
        text = re.sub(
            rf'(?m)^{key}\s*=.*$',
            f'{key} = {{ "127.0.0.1", "::1" }}',
            text,
        )
    else:
        text += f'\n{key} = {{ "127.0.0.1", "::1" }}\n'
open(path, "w").write(text)
print("OK c2s_interfaces + interfaces")
PY

# Nettoyer doublons consider_* hors VirtualHost
if [[ -f "$CFG" ]]; then
  cp -a "$CFG" "/root/nginx-backups/$(basename "$CFG").force.$(date +%Y%m%d%H%M%S)"
  python3 - "$CFG" "$DOMAIN" "$AUTH" <<'PY'
import re, sys
path, domain, auth = sys.argv[1:4]
text = open(path).read()
# Supprimer lignes consider_* globales (hors indentation VirtualHost)
text = re.sub(r'(?m)^consider_(websocket_secure|bosh_secure)\s*=.*\n', '', text)
# S'assurer qu'elles sont dans VirtualHost domain
pat = rf'(VirtualHost "{re.escape(domain)}")'
if pat in text:
    for key in ("consider_websocket_secure", "consider_bosh_secure", "cross_domain_websocket", "cross_domain_bosh"):
        if not re.search(rf'VirtualHost "{re.escape(domain)}"[\s\S]*?{key}', text):
            text = re.sub(pat, f'VirtualHost "{domain}"\n    {key} = true', text, count=1)
# auth: c2s sans TLS obligatoire pour focus/jvb local
pat_a = rf'(VirtualHost "{re.escape(auth)}")'
if pat_a in text and 'c2s_require_encryption' not in text:
    text = re.sub(pat_a, f'VirtualHost "{auth}"\n    c2s_require_encryption = false', text, count=1)
open(path, "w").write(text)
print("OK vhost")
PY
fi

# Désactiver jaas / jigasi fichiers restants
for f in /etc/prosody/conf.avail/jaas.cfg.lua /etc/prosody/conf.d/jaas.cfg.lua; do
  [[ -f "$f" ]] && mv -f "$f" "/root/nginx-backups/$(basename "$f").disabled.$(date +%Y%m%d%H%M%S)"
done

prosodyctl check config
systemctl stop prosody
sleep 2
pkill -9 -f '/usr/bin/prosody' 2>/dev/null || true
pkill -9 -f 'lua.*prosody' 2>/dev/null || true
sleep 1
systemctl start prosody
sleep 5

NEW_PID="$(pgrep -o -f 'lua.*prosody' 2>/dev/null || true)"
echo "==> PID Prosody après: ${NEW_PID:-ECHEC}"
[[ -n "$NEW_PID" && "$NEW_PID" != "$OLD_PID" ]] && echo "OK: nouveau processus" || echo "WARN: même PID ou absent"

echo ""
echo "==> 5222 (attendu: 127.0.0.1 uniquement)"
ss -tlnp | grep 5222 || echo "WARN: rien sur 5222"

if ss -tlnp | grep -q '0.0.0.0:5222'; then
  echo "WARN: 5222 encore public — blocage ufw"
  if command -v ufw >/dev/null 2>&1; then
    ufw deny 5222/tcp 2>/dev/null || true
    ufw reload 2>/dev/null || true
  fi
fi

systemctl restart jicofo jitsi-videobridge2 2>/dev/null || true

: > /var/log/prosody/prosody.log 2>/dev/null || true

echo ""
grep -nE 'consider_websocket_secure|consider_bosh_secure' "$CFG" | head -6
echo ""
echo "OK — retestez Jitsi (privé), puis:"
echo "  sudo grep -i 'insecure session' /var/log/prosody/prosody.log | tail -3"
