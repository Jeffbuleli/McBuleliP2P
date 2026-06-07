#!/bin/bash
# service-unavailable sur IQ focus alors que c2s montre focus@auth.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
FOCUS_COMP="focus.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== diagnose-focus-iq-routing (${ROOM}) =========="

echo ""
echo "==> 1. Services"
systemctl is-active prosody jicofo 2>/dev/null || true

echo ""
echo "==> 2. focus component (target_address EXACT)"
grep -A5 "Component \"${FOCUS_COMP}\"" /etc/prosody/conf.d/${DOMAIN}.cfg.lua 2>/dev/null || \
  echo "FAIL: composant absent"

echo ""
echo "==> 3. c2s auth COMPLET (compter focus@)"
prosodyctl shell c2s show "${AUTH}" 2>/dev/null || echo "(échec c2s show)"
FOCUS_N=$(prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -c "focus@${AUTH}" 2>/dev/null || true)
FOCUS_N=${FOCUS_N:-0}
echo "  sessions focus@${AUTH}: ${FOCUS_N}"
[[ "$FOCUS_N" -eq 0 ]] && echo "  FAIL: aucune session focus"
[[ "$FOCUS_N" -gt 1 ]] && echo "  WARN: plusieurs focus → client_proxy peut router vers session morte"

echo ""
echo "==> 4. c2s live (1 seul onglet pour test isolé)"
C2S_N=$(prosodyctl shell c2s show "${DOMAIN}" 2>/dev/null | grep -c registered 2>/dev/null || true)
C2S_N=${C2S_N:-0}
echo "  registered: ${C2S_N}"
[[ "$C2S_N" -gt 1 ]] && echo "  WARN: ${C2S_N} clients — fermer onglets, tester avec 1 seul d'abord"

echo ""
echo "==> 5. Jicofo Registered récent ?"
journalctl -u jicofo --since "5 min ago" 2>/dev/null | grep -i Registered | tail -3 || \
  echo "  FAIL: pas de Registered dans les 5 dernières minutes"
tail -30 /var/log/jitsi/jicofo.log 2>/dev/null | grep -iE 'Registered|Allocated|SEVERE|conference' | tail -8 || \
  echo "  (aucune ligne conference/Allocated récente)"

echo ""
echo "==> 6. prosody.log — service-unavailable / focus (50 dernières lignes pertinentes)"
grep -iE 'service-unavailable|focus\.|conference request|focus@' /var/log/prosody/prosody.log 2>/dev/null | tail -20 || \
  echo "(aucune — activer join puis relancer)"

echo ""
echo "==> 7. jicofo.conf client-proxy"
grep -E 'client-proxy|conference-muc-jid|hostname|domain|username' /etc/jitsi/jicofo/jicofo.conf 2>/dev/null | head -8

echo ""
echo "INTERPRÉTATION"
if [[ "$FOCUS_N" -ge 1 && "$C2S_N" -ge 1 ]]; then
  echo "  focus visible + client(s) MAIS service-unavailable = session focus FANTÔME ou target_address faux"
  echo "  → sudo bash ops/jitsi/fix-focus-pre-join.sh"
  echo "  → 1 SEUL onglet Chrome privé (gen-live-join-url), pas 2"
elif [[ "$FOCUS_N" -eq 0 ]]; then
  echo "  → sudo bash ops/jitsi/fix-jicofo-localhost.sh"
else
  echo "  → fermer onglets, fix-focus-pre-join, puis 1 onglet test"
fi
