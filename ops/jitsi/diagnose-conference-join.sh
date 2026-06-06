#!/bin/bash
# Pourquoi auth OK mais participants ne se voient pas / bouton Joindre figé.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
ROOM="${1:-test-live-mcbuleli}"

echo "==> 1. JVB dans le brewery (obligatoire pour média + conférence)"
grep -iE 'MucClient|brewery|Authenticated|login|error|host-unknown|Joined' /var/log/jitsi/jvb.log 2>/dev/null | tail -15 || echo "(pas de lignes muc)"

echo ""
echo "==> 2. Jicofo — bridges + salle ${ROOM}"
grep -iE "Added bridge|bridge.*available|bridge|brewery|conference|${ROOM}|participant|Allocated|colibri" /var/log/jitsi/jicofo.log 2>/dev/null | tail -25 || true

echo ""
echo "==> 2b. JVB — colibri / endpoints (média)"
grep -iE "colibri|endpoint|ICE|candidate|expired|Conference" /var/log/jitsi/jvb.log 2>/dev/null | tail -15 || true

echo ""
echo "==> 2c. UDP 10000 + IP publique JVB"
ss -ulnp 2>/dev/null | grep 10000 || echo "WARN: JVB n'écoute pas UDP 10000"
grep -iE 'NAT_HARVESTER|static-mapping|public-address' /etc/jitsi/videobridge/jvb.conf /etc/jitsi/videobridge/sip-communicator.properties 2>/dev/null | head -8 || true

echo ""
echo "==> 3. Prosody — join MUC / token_verification"
grep -iE "muc|${ROOM}|token_verification|not allowed|forbidden" /var/log/prosody/prosody.log 2>/dev/null | tail -20 || true

echo ""
echo "==> 4. Composants Prosody"
grep -nE 'Component "internal\.auth|conference\.|jvbbrewery|focus\.' \
  /etc/prosody/conf.d/${DOMAIN}.cfg.lua 2>/dev/null | head -20

echo ""
echo "==> 5. config.js (prejoin / lobby)"
grep -nE 'prejoinPageEnabled|enableLobby|startAudioMuted' \
  /etc/jitsi/meet/${DOMAIN}-config.js 2>/dev/null | tail -10

echo ""
echo "==> Interprétation"
echo "  - Authenticated@live.mcbuleli.org = JWT OK (couche XMPP)"
echo "  - Pour se voir: JVB brewery + Jicofo bridge + join MUC ${ROOM}"
echo "  - Si JVB sans 'Joined' brewery → bash ops/jitsi/fix-jvb-auth-domain.sh"
