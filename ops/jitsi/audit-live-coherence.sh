#!/bin/bash
# Audit cohérence Jitsi McBuleli — host + guest même MUC conference.live.mcbuleli.org
# Usage (root VPS): bash ops/jitsi/audit-live-coherence.sh [room]
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
INTERNAL="internal.${AUTH}"
CONFERENCE="conference.${DOMAIN}"
GUEST="guest.${DOMAIN}"
LOBBY="lobby.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"
MUC_JID="${ROOM}@${CONFERENCE}"

MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"
PROSODY_CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$PROSODY_CFG" ]] || PROSODY_CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"
PROSODY_MAIN="/etc/prosody/prosody.cfg.lua"
JICOFO_CFG="/etc/jitsi/jicofo/jicofo.conf"
JVB_CFG="/etc/jitsi/videobridge/jvb.conf"

pass() { echo "  [PASS] $*"; }
fail() { echo "  [FAIL] $*"; }
warn() { echo "  [WARN] $*"; }
info() { echo "  [INFO] $*"; }
section() { echo ""; echo "========== $* =========="; }

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root: sudo bash $0"; exit 1; }

FAIL_COUNT=0
record_fail() { FAIL_COUNT=$((FAIL_COUNT + 1)); }

section "0. Services"
for svc in prosody jicofo jitsi-videobridge2 nginx; do
  if systemctl is-active --quiet "$svc"; then
    pass "$svc active"
  else
    fail "$svc NOT active"
    record_fail
    systemctl status "$svc" --no-pager -l 2>/dev/null | head -5 || true
  fi
done

section "1. config.js — MUC / guest / lobby / subdomain"
[[ -f "$MEET_CFG" ]] || { fail "Missing $MEET_CFG"; record_fail; }

# Compteur blocs mcbuleli (sprawl = risque conflit)
MCB_MARKERS="$(grep -cE 'mcbuleli-(jwt-guest|jwt-only|no-guest|same-room|muc-fixed|live-baseline)' "$MEET_CFG" 2>/dev/null || echo 0)"
if [[ "$MCB_MARKERS" -gt 1 ]]; then
  warn "$MCB_MARKERS blocs mcbuleli-* dans config.js — exécuter fix-live-unified-baseline.sh"
else
  pass "config.js: au plus un bloc mcbuleli override ($MCB_MARKERS)"
fi

if grep -qE "muc:\s*'conference\.'\s*\+\s*subdomain" "$MEET_CFG" && ! grep -q "mcbuleli-live-baseline" "$MEET_CFG"; then
  warn "Template muc dynamique (subdomain) actif sans override baseline"
fi

if tail -30 "$MEET_CFG" | grep -qE "config\.hosts\.muc\s*=\s*'${CONFERENCE}'"; then
  pass "config.hosts.muc final = ${CONFERENCE}"
elif grep -qE "hosts\.muc.*${CONFERENCE}" "$MEET_CFG"; then
  pass "hosts.muc référence ${CONFERENCE}"
else
  fail "config.hosts.muc ne force pas ${CONFERENCE}"
  record_fail
fi

if grep -qE 'delete config\.hosts\.anonymousdomain|//.*anonymousdomain' "$MEET_CFG" && \
   ! tail -40 "$MEET_CFG" | grep -qE "config\.hosts\.anonymousdomain\s*="; then
  pass "anonymousdomain désactivé (JWT-only)"
elif grep -qE "anonymousdomain:\s*'${GUEST}'|config\.hosts\.anonymousdomain\s*=\s*'${GUEST}'" "$MEET_CFG"; then
  fail "anonymousdomain=${GUEST} ACTIF → split MUC host/guest (ligne fautive ci-dessous)"
  record_fail
  grep -nE 'anonymousdomain' "$MEET_CFG" | grep -v '// enableLobbyChat' | head -5
else
  warn "anonymousdomain: état ambigu — vérifier config servi"
fi

if tail -40 "$MEET_CFG" | grep -qE 'config\.(disableLobby|securityUi)'; then
  grep -nE 'enableLobby|disableLobby|hideLobbyButton' "$MEET_CFG" | grep -v '// enableLobbyChat' | tail -6
  if tail -40 "$MEET_CFG" | grep -q 'enableLobby = false'; then
    fail "enableLobby=false présent → crash isLobbySupported (fix-lobby-ui-crash.sh)"
    record_fail
  elif tail -40 "$MEET_CFG" | grep -q 'disableLobby = true'; then
    pass "lobby inactif (disableLobby + pas enableLobby=false)"
  else
    fail "disableLobby=true absent"
    record_fail
  fi
else
  warn "lobby overrides absents en fin de fichier"
fi

if grep -qE "^var subdomain = '';" "$MEET_CFG" || grep -q "subdomain = ''" "$MEET_CFG"; then
  pass "subdomain forcé vide (pas multi-tenant)"
else
  info "subdomain non forcé vide (OK si toujours '' via URL)"
fi

section "2. config.js SERVI (nginx)"
SERVED="$(curl -s "https://${DOMAIN}/config.js" 2>/dev/null || true)"
if echo "$SERVED" | grep -qE "hosts\.muc.*${CONFERENCE}|muc:\s*'${CONFERENCE}'"; then
  pass "config.js servi → MUC ${CONFERENCE}"
else
  fail "config.js servi ne contient pas ${CONFERENCE}"
  record_fail
  echo "$SERVED" | grep -iE 'hosts\.muc|anonymousdomain|enableLobby' | head -6
fi
if echo "$SERVED" | grep -qE "anonymousdomain.*${GUEST}"; then
  fail "config.js SERVI expose anonymousdomain=${GUEST}"
  record_fail
fi

section "3. Prosody VirtualHosts"
for vh in "$DOMAIN" "$GUEST" "$CONFERENCE" "$AUTH" "$INTERNAL" "$LOBBY"; do
  if grep -qE "^VirtualHost \"${vh}\"" "$PROSODY_CFG" 2>/dev/null; then
    if [[ "$vh" == "$GUEST" || "$vh" == "$LOBBY" ]]; then
      fail "VirtualHost ${vh} ACTIF (doit être commenté pour McBuleli JWT-only)"
      record_fail
      grep -n "VirtualHost \"${vh}\"" "$PROSODY_CFG" | head -1
    else
      pass "VirtualHost ${vh} présent"
    fi
  elif grep -qE "^-- VirtualHost \"${vh}\"" "$PROSODY_CFG" 2>/dev/null || \
       grep -qE "^--.*VirtualHost \"${vh}\"" "$PROSODY_CFG" 2>/dev/null; then
    if [[ "$vh" == "$GUEST" || "$vh" == "$LOBBY" ]]; then
      pass "VirtualHost ${vh} commenté (OK)"
    else
      fail "VirtualHost requis ${vh} est commenté"
      record_fail
    fi
  else
    if [[ "$vh" == "$LOBBY" || "$vh" == "$GUEST" ]]; then
      pass "VirtualHost ${vh} absent (OK)"
    elif [[ "$vh" == "$INTERNAL" ]]; then
      if grep -q "Component \"${INTERNAL}\"" "$PROSODY_CFG"; then
        pass "internal via Component ${INTERNAL}"
      else
        fail "VirtualHost/Component ${INTERNAL} manquant"
        record_fail
      fi
    else
      fail "VirtualHost ${vh} introuvable"
      record_fail
    fi
  fi
done

section "4. Prosody — auth / encryption / bosh / websocket"
if grep -A30 "VirtualHost \"${DOMAIN}\"" "$PROSODY_CFG" | grep -q 'authentication = "token"'; then
  pass "live.mcbuleli.org → authentication token"
else
  fail "authentication token manquant sur ${DOMAIN}"
  record_fail
fi

if grep -A40 "VirtualHost \"${DOMAIN}\"" "$PROSODY_CFG" | grep -q 'enable_domain_verification = false'; then
  pass "enable_domain_verification = false"
else
  warn "enable_domain_verification absent ou true (JWT guest peut échouer)"
fi

for key in consider_websocket_secure consider_bosh_secure cross_domain_websocket cross_domain_bosh; do
  if grep -A40 "VirtualHost \"${DOMAIN}\"" "$PROSODY_CFG" | grep -q "${key}"; then
    pass "${key} dans VirtualHost ${DOMAIN}"
  else
    fail "${key} manquant dans VirtualHost ${DOMAIN}"
    record_fail
  fi
done

# Doublons globaux
if grep -E '^consider_(websocket|bosh)_secure' "$PROSODY_CFG" 2>/dev/null | grep -v '^[[:space:]]'; then
  warn "consider_*_secure en dehors d'un VirtualHost (doublon)"
fi

if grep -A15 "VirtualHost \"${AUTH}\"" "$PROSODY_CFG" | grep -q 'c2s_require_encryption = false'; then
  pass "auth: c2s_require_encryption = false (focus/jvb local)"
else
  warn "auth: c2s_require_encryption non false — focus local peut échouer"
fi

section "5. muc_domain_mapper / lobby / jigasi"
if grep -q 'muc_lobby_rooms' "$PROSODY_CFG" 2>/dev/null; then
  fail "muc_lobby_rooms encore dans modules Prosody → lobby split"
  record_fail
  grep -n 'muc_lobby_rooms' "$PROSODY_CFG"
else
  pass "muc_lobby_rooms absent"
fi

if grep -iE 'Lobby component loaded|muc_lobby' /var/log/prosody/prosody.log 2>/dev/null | tail -1 | grep -q .; then
  fail "Prosody a chargé lobby récemment (logs)"
  record_fail
  grep -iE 'Lobby component loaded|muc_lobby' /var/log/prosody/prosody.log | tail -3
else
  pass "pas de lobby component récent dans prosody.log"
fi

info "muc_domain_mapper dans les logs = NORMAL (module Prosody standard, pas multi-tenant)"
if grep -q 'jigasi\.meet\.jitsi' /etc/prosody/conf.d/*.lua /etc/prosody/conf.avail/*.lua 2>/dev/null; then
  fail "jigasi.meet.jitsi encore dans un .cfg.lua"
  record_fail
else
  pass "pas de jigasi.meet.jitsi dans configs Prosody"
fi

if [[ -f /etc/prosody/conf.avail/jaas.cfg.lua ]] || [[ -f /etc/prosody/conf.d/jaas.cfg.lua ]]; then
  fail "jaas.cfg.lua encore présent → VirtualHost parasite"
  record_fail
else
  pass "jaas.cfg.lua désactivé"
fi

section "6. prosody.cfg.lua — c2s_interfaces"
grep -nE '^(interfaces|c2s_interfaces|s2s_interfaces)\s*=' "$PROSODY_MAIN" 2>/dev/null | head -6 || true
if grep -q 'c2s_interfaces = { "127.0.0.1"' "$PROSODY_MAIN" 2>/dev/null || \
   grep -q 'c2s_interfaces = { "127.0.0.1", "::1" }' "$PROSODY_MAIN" 2>/dev/null; then
  pass "c2s_interfaces localhost only"
else
  warn "c2s_interfaces pas restreint à 127.0.0.1 (insecure session spam possible)"
fi
ss -tlnp 2>/dev/null | grep 5222 || info "rien sur 5222"
if ss -tlnp 2>/dev/null | grep -q '0.0.0.0:5222'; then
  warn "5222 écoute sur 0.0.0.0 — bots → 'insecure session' (pas la cause split room)"
fi

section "7. Jicofo + JVB"
for key in "conference-muc-jid = \"${CONFERENCE}\"" "client-proxy = \"focus.${DOMAIN}\"" "xmpp-domain = \"${DOMAIN}\""; do
  if grep -qF "$key" "$JICOFO_CFG" 2>/dev/null; then
    pass "jicofo: $key"
  else
    fail "jicofo manquant: $key"
    record_fail
  fi
done

if grep -q "Component \"focus.${DOMAIN}\"" "$PROSODY_CFG"; then
  pass "Prosody focus.${DOMAIN} client_proxy"
else
  fail "Component focus.${DOMAIN} manquant"
  record_fail
fi

if grep -qiE 'Authenticated|Added new videobridge|Registered' /var/log/jitsi/jicofo.log 2>/dev/null | tail -1 | grep -q .; then
  pass "Jicofo connecté (logs récents)"
else
  warn "Jicofo: pas de Authenticated/Registered récent"
fi

section "8. nginx — BOSH / websocket"
NGINX_VHOST=""
for f in /etc/nginx/sites-enabled/${DOMAIN}.conf /etc/nginx/sites-enabled/${DOMAIN}; do
  [[ -f "$f" ]] && NGINX_VHOST="$f" && break
done
if [[ -n "$NGINX_VHOST" ]] && grep -q 'mcbuleli-xmpp-proxy' "$NGINX_VHOST"; then
  pass "nginx include mcbuleli-xmpp-proxy"
else
  fail "nginx: proxy /http-bind et /xmpp-websocket manquant"
  record_fail
fi
curl -sI "https://${DOMAIN}/http-bind" 2>/dev/null | head -1 | grep -qE '200|405|404' && pass "https://${DOMAIN}/http-bind répond" || warn "/http-bind inaccessible"
curl -sI "https://${DOMAIN}/xmpp-websocket" 2>/dev/null | head -1 | grep -qE '200|400|404' && pass "https://${DOMAIN}/xmpp-websocket répond" || warn "/xmpp-websocket inaccessible"

section "9. Logs live — MUC ${MUC_JID}"
info "Relancer pendant join simultané host+guest pour lignes fraîches"
grep -i "${MUC_JID}" /var/log/prosody/prosody.log 2>/dev/null | tail -5 || warn "aucune ligne ${MUC_JID} (join pas actif?)"
grep -iE "Authenticated.*@${DOMAIN}" /var/log/prosody/prosody.log 2>/dev/null | tail -4 || true
if grep -i "Authenticated.*@guest\." /var/log/prosody/prosody.log 2>/dev/null | tail -1 | grep -q .; then
  fail "Auth récente sur guest.* → clients utilisent anonymousdomain"
  record_fail
  grep -i "Authenticated.*@guest\." /var/log/prosody/prosody.log | tail -3
fi
grep -iE "${ROOM}|Allocated|Creating conference" /var/log/jitsi/jicofo.log 2>/dev/null | tail -6 || warn "Jicofo: pas de conférence ${ROOM} récente"

section "RÉSUMÉ"
if [[ "$FAIL_COUNT" -eq 0 ]]; then
  echo "AUDIT OK ($FAIL_COUNT échec) — si split persiste: lobby JWT (lobby_bypass Render) ou cache navigateur"
else
  echo "AUDIT: $FAIL_COUNT échec(s) — correction: sudo bash ops/jitsi/fix-live-unified-baseline.sh"
fi
echo ""
echo "Causes split room typiques (ordre probabilité McBuleli):"
echo "  1. fix-prosody-jwt-guest.sh réactive guest+anonymousdomain (conflit avec JWT-only)"
echo "  2. Lobby Prosody (muc_lobby_rooms) — invité moderator:false en lobby.${DOMAIN}"
echo "  3. config.js sprawl — plusieurs blocs mcbuleli-* se contredisent"
echo "  4. muc dynamique subdomain ≠ '' (rare si URL identique)"
echo ""
echo "muc_domain_mapper = module standard Prosody, PAS la cause du split."
