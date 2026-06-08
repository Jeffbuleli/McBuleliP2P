#!/bin/bash
# client_proxy envoie subscribe à focus@auth mais sans roster approuvé → sessions[] vide
# → service-unavailable malgré focus@auth online dans c2s.
# Réf: jitsi/jicofo#676, jitsi-meet mod_roster_command
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
FOCUS_COMP="focus.${DOMAIN}"
FOCUS_JID="focus@${AUTH}"
PROSODY_MAIN="/etc/prosody/prosody.cfg.lua"
JITSI_PLUGINS="/usr/share/jitsi-meet/prosody-plugins"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== fix-focus-roster-subscribe =========="
echo "Composant: ${FOCUS_COMP} → ${FOCUS_JID}"
echo ""

echo "==> 1. plugin_paths Jitsi (mod_client_proxy + mod_roster_command)"
if [[ -f "$PROSODY_MAIN" ]]; then
  if grep -q 'jitsi-meet/prosody-plugins' "$PROSODY_MAIN"; then
    echo "OK: plugin_paths contient jitsi-meet/prosody-plugins"
  else
    echo "WARN: plugin_paths sans jitsi-meet — patch recommandé"
    grep -n 'plugin_paths' "$PROSODY_MAIN" | head -3 || echo "(plugin_paths absent)"
  fi
fi
if [[ -f "${JITSI_PLUGINS}/mod_roster_command.lua" ]]; then
  echo "OK: ${JITSI_PLUGINS}/mod_roster_command.lua"
else
  echo "FAIL: mod_roster_command absent — apt install jitsi-meet-prosody"
  exit 1
fi
if [[ -f "${JITSI_PLUGINS}/mod_client_proxy.lua" ]]; then
  echo "OK: mod_client_proxy.lua"
else
  echo "WARN: mod_client_proxy.lua absent dans jitsi-meet plugins"
fi

echo ""
echo "==> 2. focus@auth connecté ?"
if ! prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -qi 'focus@'; then
  echo "WARN: focus@${AUTH} absent — start jicofo d'abord"
  systemctl start jicofo 2>/dev/null || true
  sleep 12
fi
prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -i focus || echo "(focus toujours absent)"

echo ""
echo "==> 3. roster subscribe (focus component → focus@auth)"
# Syntaxe handbook Jitsi: subscribe <component_host> <focus_jid>
if prosodyctl mod_roster_command subscribe "${FOCUS_COMP}" "${FOCUS_JID}" 2>&1; then
  echo "OK: mod_roster_command subscribe"
else
  echo "WARN: mod_roster_command a échoué — essai subscribe_both"
  prosodyctl mod_roster_command subscribe_both "${FOCUS_COMP}" "${FOCUS_JID}" 2>&1 || true
fi

echo ""
echo "==> 4. Redémarrer Jicofo (renvoyer presence available → composant)"
systemctl restart jicofo
sleep 12

echo ""
echo "==> 5. Vérification"
prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -i focus || echo "FAIL: focus absent"
tail -30 /var/log/jitsi/jicofo.log 2>/dev/null | grep -iE 'Registered|SEVERE' | tail -5 || true

echo ""
echo "TEST (60s): host via app McBuleli → console sans service-unavailable"
echo "  sudo tail -f /var/log/jitsi/jicofo.log | grep -iE 'Allocated|Creating|conference'"
echo ""
echo "Si encore service-unavailable:"
echo "  sudo prosodyctl shell"
echo "  > watch:stanzas('${FOCUS_COMP}')"
echo "  (pendant join — doit voir IQ set conference, pas seulement error)"
