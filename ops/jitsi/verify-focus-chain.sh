#!/bin/bash
# Vérifie la chaîne focus: composant Prosody → session focus@auth → jicofo.conf
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
FOCUS_COMP="focus.${DOMAIN}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
JICOFO="/etc/jitsi/jicofo/jicofo.conf"
JICOFO_LEGACY="/etc/jitsi/jicofo/config"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== verify-focus-chain ${FOCUS_COMP} =========="

echo ""
echo "==> 1. Composant client_proxy Prosody"
grep -A6 "Component \"${FOCUS_COMP}\"" "$CFG" 2>/dev/null || echo "FAIL: composant absent"

echo ""
echo "==> 2. target_address attendu: focus@${AUTH}"
grep -A6 "Component \"${FOCUS_COMP}\"" "$CFG" 2>/dev/null | grep target_address || echo "FAIL: target_address manquant"

echo ""
echo "==> 3. Session focus@auth (1 seule, online)"
FOCUS_LINES="$(prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -i focus || true)"
if [[ -z "$FOCUS_LINES" ]]; then
  echo "FAIL: focus@${AUTH} non connecté"
else
  echo "$FOCUS_LINES"
  FOCUS_N=$(echo "$FOCUS_LINES" | grep -c . || true)
  [[ "$FOCUS_N" -le 1 ]] && echo "OK: une session focus" || echo "WARN: plusieurs lignes focus"
fi

echo ""
echo "==> 4. jicofo.conf (client-proxy + muc-jid)"
grep -E 'client-proxy|conference-muc-jid|hostname|domain|username' "$JICOFO" 2>/dev/null | head -10

echo ""
echo "==> 5. Mot de passe focus configuré (pas affiché)"
if grep -q '^JICOFO_AUTH_PASSWORD=' "$JICOFO_LEGACY" 2>/dev/null; then
  echo "OK: JICOFO_AUTH_PASSWORD présent dans ${JICOFO_LEGACY}"
else
  echo "FAIL: JICOFO_AUTH_PASSWORD absent"
fi

echo ""
echo "==> 6. Jicofo log récent"
grep -iE 'Registered|Authenticated|SEVERE|XmlPullParser|Failed' /var/log/jitsi/jicofo.log 2>/dev/null | tail -6 || echo "(vide)"

echo ""
echo "==> 7. Test navigateur ISOLÉ (1 seul onglet)"
echo "  sudo bash ops/jitsi/gen-live-join-url.sh test-live-mcbuleli"
echo "  Chrome PRIVÉ → coller URL → Cmd+Option+J"
echo "  Si service-unavailable: sudo bash ops/jitsi/fix-focus-service-unavailable.sh"
echo "  Si pas d'erreur mais pas de room: fix-config-force-join.sh + hard refresh"
