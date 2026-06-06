#!/bin/bash
# Correction PROPRE McBuleli Live — une baseline, pas de patches empilés.
# Remplace la chaîne fix-no-guest + fix-live-same-room + fix-prosody-jwt-guest contradictoire.
#
# Usage (root VPS):
#   cd ~/McBuleliP2P && git pull
#   sudo bash ops/jitsi/fix-live-unified-baseline.sh
#   sudo bash ops/jitsi/audit-live-coherence.sh test-live-mcbuleli
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
CONFERENCE="conference.${DOMAIN}"
GUEST="guest.${DOMAIN}"
MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"
PROSODY_CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$PROSODY_CFG" ]] || PROSODY_CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"
STAMP="$(date +%Y%m%d%H%M%S)"
BACKUP="/root/nginx-backups/unified-baseline-${STAMP}"
MARKER="mcbuleli-live-baseline"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
mkdir -p "$BACKUP"

echo "==> 0. Sauvegardes → $BACKUP"
for f in "$MEET_CFG" "$PROSODY_CFG" /etc/prosody/prosody.cfg.lua \
         /etc/jitsi/jicofo/jicofo.conf /etc/jitsi/jicofo/config; do
  [[ -f "$f" ]] && cp -a "$f" "$BACKUP/"
done

echo ""
echo "==> 1. Désactiver configs Prosody parasites (jaas, jigasi)"
for f in /etc/prosody/conf.avail/jaas.cfg.lua /etc/prosody/conf.d/jaas.cfg.lua; do
  [[ -f "$f" ]] && mv -f "$f" "$BACKUP/$(basename "$f").disabled"
done
systemctl stop jigasi 2>/dev/null || true
systemctl disable jigasi 2>/dev/null || true

echo ""
echo "==> 2. config.js — supprimer TOUS les blocs mcbuleli-* puis une seule baseline"
[[ -f "$MEET_CFG" ]] || { echo "ERREUR: $MEET_CFG absent"; exit 1; }

python3 - "$MEET_CFG" "$DOMAIN" "$CONFERENCE" "$MARKER" <<'PY'
import re, sys

path, domain, conference, marker = sys.argv[1:5]
text = open(path).read()

# Supprimer blocs // mcbuleli-* jusqu'à la prochaine ligne vide double ou fin
text = re.sub(
    r'(?ms)^// mcbuleli-[^\n]*\n.*?(?=\n// mcbuleli-|\n/\*|\Z)',
    '',
    text,
)
# Supprimer lignes orphelines mcbuleli deploymentInfo
text = re.sub(r'(?m)^config\.deploymentInfo\.environment = .*mcbuleli.*\n', '', text)

# subdomain vide (template Jitsi multi-tenant neutralisé)
text = re.sub(r"(?m)^(\s*)var\s+subdomain\s*=.*$", r"\1var subdomain = '';", text, count=1)

# Un seul bloc final
baseline = f"""

// {marker} — source unique McBuleli (ne pas dupliquer)
config.hosts = config.hosts || {{}};
config.hosts.domain = '{domain}';
config.hosts.authdomain = '{domain}';
config.hosts.muc = '{conference}';
delete config.hosts.anonymousdomain;

config.bosh = '//{domain}/http-bind';
config.websocket = 'wss://{domain}/xmpp-websocket';

config.enableLobby = false;
config.disableLobby = true;
config.enableUserRolesBasedOnToken = false;

config.transcription = {{ disabled: true, enableCaptionButton: false }};
config.liveStreaming = {{ enabled: false }};
config.recordingService = {{ enabled: false }};
delete config.hiddenDomain;
config.p2p = {{ enabled: true }};
"""
if marker not in text:
    text = text.rstrip() + baseline + "\n"
else:
    text = re.sub(rf'(?ms)// {re.escape(marker)}.*', baseline.strip(), text, count=1)

open(path, "w").write(text)
print("OK config.js baseline")
PY

node --check "$MEET_CFG"

echo ""
echo "==> 3. Prosody — JWT main-only, guest/lobby off, pas de doublons"
bash "$SCRIPT_DIR/fix-prosody-jwt-main-only.sh"
bash "$SCRIPT_DIR/fix-prosody-purge-stray-hosts.sh"

# JWT secret si présent
if [[ -f /root/.mcbuleli-jitsi-secret ]]; then
  export JITSI_JWT_SECRET="$(tr -d '[:space:]' < /root/.mcbuleli-jitsi-secret)"
  export JITSI_APP_ID="${JITSI_APP_ID:-mcbuleli_live}"
  echo "==> 3b. Sync JWT Prosody"
  # apply-jitsi-jwt sans fix-prosody-jwt-guest (corrigé)
  bash "$SCRIPT_DIR/apply-jitsi-jwt.sh"
fi

echo ""
echo "==> 4. prosody.cfg.lua — c2s_interfaces localhost"
bash "$SCRIPT_DIR/fix-prosody-force-localhost.sh"

echo ""
echo "==> 5. nginx — BOSH/websocket + no-cache config.js"
bash "$SCRIPT_DIR/fix-nginx-xmpp-proxy.sh"
NGINX_VHOST=""
for f in /etc/nginx/sites-enabled/${DOMAIN}.conf /etc/nginx/sites-enabled/${DOMAIN}; do
  [[ -f "$f" ]] && NGINX_VHOST="$f" && break
done
if [[ -n "$NGINX_VHOST" ]] && ! grep -q 'mcbuleli-config-nocache' "$NGINX_VHOST"; then
  sed -i '/mcbuleli-config-nocache/d' "$NGINX_VHOST"
  sed -i "/server_name.*live\.mcbuleli\.org/a\\
    # mcbuleli-config-nocache\\
    location ~ -config\\\\.js\$ {\\
        add_header Cache-Control \"no-store, no-cache, must-revalidate\";\\
        try_files \\\$uri =404;\\
    }" "$NGINX_VHOST"
  nginx -t && systemctl reload nginx
fi

echo ""
echo "==> 6. Jicofo + JVB brewery"
bash "$SCRIPT_DIR/fix-jicofo-localhost.sh"
bash "$SCRIPT_DIR/fix-jitsi-brewery-complete.sh"
bash "$SCRIPT_DIR/fix-jicofo-zombie.sh"

echo ""
echo "==> 7. Restart + vérif"
prosodyctl check config
systemctl restart prosody
sleep 4
systemctl restart jitsi-videobridge2
systemctl reload nginx
sleep 8

echo ""
echo "--- Services ---"
systemctl is-active prosody jicofo jitsi-videobridge2 nginx

echo ""
echo "--- config.js servi (MUC / guest) ---"
curl -s "https://${DOMAIN}/config.js" | grep -iE 'hosts\.muc|anonymousdomain|enableLobby|bosh|websocket' | head -10

echo ""
echo "--- Prosody startup (pas lobby/jigasi) ---"
grep -iE 'Lobby component|jigasi\.meet|muc_lobby' /var/log/prosody/prosody.log | tail -4 || echo "(OK: aucun)"

echo ""
echo "--- Jicofo ---"
grep -iE 'Registered|Added new videobridge|Authenticated' /var/log/jitsi/jicofo.log | tail -5

echo ""
echo "OK baseline appliquée."
echo ""
echo "TEST LIVE (obligatoire):"
echo "  1. Fermer TOUS les onglets Jitsi / vider cache (Ctrl+Shift+R)"
echo "  2. Host: App → Démarrer le live (test-live-mcbuleli)"
echo "  3. Guest: App → Vidéo (même session)"
echo "  4. Terminal A: sudo tail -f /var/log/prosody/prosody.log"
echo "  5. Terminal B: sudo tail -f /var/log/jitsi/jicofo.log  (pas journalctl — conférences dans jicofo.log)"
echo "  6. Attendu: test-live-mcbuleli@${CONFERENCE} pour les DEUX"
echo "  7. sudo bash ops/jitsi/audit-live-coherence.sh test-live-mcbuleli"
