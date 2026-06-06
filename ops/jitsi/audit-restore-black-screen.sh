#!/bin/bash
# Audit écran noir live.mcbuleli.org — config.js cassé, JWT non consommé.
# Usage (root VPS): cd ~/McBuleliP2P && bash ops/jitsi/audit-restore-black-screen.sh
# Restauration auto si node --check échoue.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
CONFIG="/etc/jitsi/meet/${DOMAIN}-config.js"
BACKUP_DIR="/root/nginx-backups"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

echo "========== AUDIT McBuleli Live — écran noir =========="
echo ""

echo "==> 1. Syntaxe config.js (cause #1 écran noir + JWT figé dans URL)"
if command -v node >/dev/null 2>&1; then
  if node --check "$CONFIG" 2>/dev/null; then
    echo "OK: syntaxe JavaScript valide"
    SYNTAX_OK=1
  else
    echo "ECHEC: SyntaxError — l'app Jitsi ne démarre pas"
    node --check "$CONFIG" 2>&1 | head -5 || true
    SYNTAX_OK=0
  fi
else
  echo "WARN: installez nodejs pour valider (apt install -y nodejs)"
  SYNTAX_OK=1
fi

echo ""
echo "==> 2. Lignes sensibles (doublons / mauvais placement)"
grep -nE 'prejoinPageEnabled|enableUserRolesBasedOnToken|enableWelcomePage|^\};' "$CONFIG" 2>/dev/null | tail -25 || true
PREJOIN_COUNT="$(grep -c 'prejoinPageEnabled' "$CONFIG" 2>/dev/null || echo 0)"
echo "    prejoinPageEnabled: ${PREJOIN_COUNT} occurrence(s)"
if [[ "$PREJOIN_COUNT" -gt 3 ]]; then
  echo "    WARN: trop de doublons (sed/echo répétés depuis ~)"
fi

echo ""
echo "==> 3. Sauvegardes disponibles"
ls -lt "$BACKUP_DIR"/*config.js* 2>/dev/null | head -8 || \
  ls -lt /root/*config.js*bak* 2>/dev/null | head -8 || \
  echo "    (aucune sauvegarde dans $BACKUP_DIR)"

echo ""
echo "==> 4. Nginx gate + index Jitsi"
curl -sI "https://${DOMAIN}/test-live-mcbuleli?jwt=test" | head -3
curl -sI "https://${DOMAIN}/libs/lib-jitsi-meet.min.js" | head -2

echo ""
echo "==> 5. Services"
systemctl is-active prosody jicofo jitsi-videobridge2 nginx 2>/dev/null | paste - - - - || true

if [[ "${SYNTAX_OK:-0}" -eq 0 ]]; then
  echo ""
  echo "==> RESTAURATION automatique (syntaxe invalide)"
  LATEST="$(ls -t "$BACKUP_DIR"/*${DOMAIN}*config.js* 2>/dev/null | head -1 || true)"
  if [[ -z "$LATEST" ]]; then
    LATEST="$(ls -t /root/*${DOMAIN}*config.js*bak* 2>/dev/null | head -1 || true)"
  fi
  if [[ -n "$LATEST" && -f "$LATEST" ]]; then
    cp -a "$CONFIG" "${CONFIG}.broken.$(date +%Y%m%d%H%M%S)"
    cp -a "$LATEST" "$CONFIG"
    echo "Restauré depuis: $LATEST"
  else
    echo "Pas de backup — lancez apply-mcbuleli-brand.sh pour reconstruire la fin du fichier"
  fi
fi

echo ""
echo "==> 6. Réparation officielle (depuis le repo, PAS depuis ~)"
if [[ -f "$SCRIPT_DIR/fix-jitsi-config-syntax.sh" ]]; then
  bash "$SCRIPT_DIR/fix-jitsi-config-syntax.sh"
fi
if [[ -f "$SCRIPT_DIR/apply-mcbuleli-brand.sh" ]]; then
  bash "$SCRIPT_DIR/apply-mcbuleli-brand.sh"
fi

echo ""
echo "==> 7. Vérification finale"
if command -v node >/dev/null 2>&1; then
  node --check "$CONFIG" && echo "OK FINAL: config.js valide — rechargez avec Ctrl+Shift+R"
fi
grep -c 'prejoinPageEnabled' "$CONFIG" || true
echo ""
echo "Test: ouvrez depuis mcbuleli.org (pas URL nue). JWT doit disparaître de la barre après 2-3 s."
