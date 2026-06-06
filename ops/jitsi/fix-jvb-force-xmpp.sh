#!/bin/bash
# Force JVB à charger jvb.conf + démarrer xmpp-client (MucClient/brewery).
# Symptôme : logs = uniquement Jetty 127.0.0.1:8080, pas de MucClient.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib-jvb-config.sh
source "${SCRIPT_DIR}/lib-jvb-config.sh"

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
INTERNAL="internal.${AUTH}"
CFG_PROSODY="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
SIP="/etc/jitsi/videobridge/sip-communicator.properties"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

JVB_PASS="$(grep -E '^JVB_AUTH_PASSWORD=|^JVB_SECRET=' "$JVB_VCFG" 2>/dev/null | head -1 | cut -d= -f2- || true)"
[[ -n "$JVB_PASS" ]] || JVB_PASS="$(openssl rand -hex 16)"

echo "==> AVANT"
grep -E '^(JVB_|JAVA_SYS_PROPS|JVB_OPTS)' "$JVB_VCFG" 2>/dev/null || echo "(config absent)"
echo "--- jvb.conf (5 premières lignes) ---"
head -5 "$JVB_HOCON" 2>/dev/null || echo "(absent)"

# Forcer JAVA_SYS_PROPS complet (une seule ligne, systemd EnvironmentFile)
ts="$(date +%Y%m%d%H%M%S)"
cp -a "$JVB_VCFG" "${JVB_VCFG}.bak.force.${ts}" 2>/dev/null || true
sed -i '/^JAVA_SYS_PROPS=/d' "$JVB_VCFG"
sed -i '/^JVB_OPTS=.*--apis=/d' "$JVB_VCFG"
cat >> "$JVB_VCFG" <<EOF

# mcbuleli-force-xmpp ${ts}
JAVA_SYS_PROPS="-Dconfig.file=${JVB_HOCON} -Dnet.java.sip.communicator.SC_HOME_DIR_LOCATION=/etc/jitsi -Dnet.java.sip.communicator.SC_HOME_DIR_NAME=videobridge -Dnet.java.sip.communicator.SC_LOG_DIR_LOCATION=/var/log/jitsi -Djava.util.logging.config.file=/etc/jitsi/videobridge/logging.properties"
EOF

mcbuleli_ensure_jvb_runtime_config "$DOMAIN" "$AUTH" "$JVB_PASS"
mcbuleli_write_jvb_hocon "$DOMAIN" "$AUTH" "$INTERNAL" "$JVB_PASS"

# Fallback legacy (si HOCON mal parsé sur vieille version)
cat > "$SIP" <<EOF
org.jitsi.videobridge.xmpp.user.shard.HOSTNAME=${DOMAIN}
org.jitsi.videobridge.xmpp.user.shard.DOMAIN=${AUTH}
org.jitsi.videobridge.xmpp.user.shard.USERNAME=jvb
org.jitsi.videobridge.xmpp.user.shard.PASSWORD=${JVB_PASS}
org.jitsi.videobridge.xmpp.user.shard.MUC_JIDS=jvbbrewery@${INTERNAL}
org.jitsi.videobridge.xmpp.user.shard.MUC_NICKNAME=jvb-${DOMAIN}
org.jitsi.videobridge.xmpp.user.shard.DISABLE_CERTIFICATE_VERIFICATION=true
EOF

# Prosody internal MUC + user jvb
if [[ -f "$CFG_PROSODY" ]] && ! grep -q "Component \"${INTERNAL}\"" "$CFG_PROSODY"; then
  cat >> "$CFG_PROSODY" <<EOF

Component "${INTERNAL}" "muc"
    storage = "memory"
    muc_room_cache_size = 1000
    modules_enabled = { "ping"; }
EOF
fi
prosodyctl deluser "jvb@${AUTH}" 2>/dev/null || true
prosodyctl register jvb "${AUTH}" "${JVB_PASS}"

chown -R jvb:jitsi /etc/jitsi/videobridge
chmod 750 /etc/jitsi/videobridge
chmod 640 "$JVB_VCFG" "$JVB_HOCON" "$SIP" 2>/dev/null || true

echo ""
echo "==> APRÈS config"
grep -E '^(JVB_|JAVA_SYS_PROPS|JVB_OPTS)' "$JVB_VCFG"
echo "--- jvb.conf ---"
cat "$JVB_HOCON"

systemctl restart prosody
sleep 2
systemctl restart jitsi-videobridge2
sleep 18

echo ""
echo "==> Processus Java (doit contenir -Dconfig.file=.../jvb.conf)"
jvb_pid="$(systemctl show -p MainPID --value jitsi-videobridge2 2>/dev/null || true)"
if [[ -n "$jvb_pid" && "$jvb_pid" != "0" ]] && [[ -r "/proc/${jvb_pid}/cmdline" ]]; then
  tr '\0' ' ' < "/proc/${jvb_pid}/cmdline"
  echo ""
  if tr '\0' ' ' < "/proc/${jvb_pid}/cmdline" | grep -q '\-Dconfig\.file='; then
    echo "OK: -Dconfig.file présent dans le processus"
  else
    echo "ECHEC: -Dconfig.file ABSENT du processus Java — JAVA_SYS_PROPS non chargé"
  fi
else
  echo "WARN: pid JVB introuvable"
fi

echo ""
echo "==> Logs JVB (30 dernières lignes brutes)"
tail -30 /var/log/jitsi/jvb.log 2>/dev/null || journalctl -u jitsi-videobridge2 -n 30 --no-pager

echo ""
echo "==> Recherche MucClient / xmpp"
if grep -qiE 'MucClient|Joined.*brewery|xmpp\.user\.shard' /var/log/jitsi/jvb.log 2>/dev/null; then
  grep -iE 'MucClient|Joined|brewery|Authenticated|error connecting' /var/log/jitsi/jvb.log | tail -12
  echo "OK — client XMPP actif"
else
  echo "ECHEC — toujours pas de MucClient. Collez toute la sortie ci-dessus."
fi
