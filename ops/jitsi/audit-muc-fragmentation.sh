#!/bin/bash
# Deep audit: MUC fragmentation / split-room root causes across full Jitsi stack.
# Usage: sudo bash ops/jitsi/audit-muc-fragmentation.sh [room]
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
INTERNAL="internal.${AUTH}"
CONFERENCE="conference.${DOMAIN}"
GUEST="guest.${DOMAIN}"
LOBBY="lobby.${DOMAIN}"
FOCUS="focus.${DOMAIN}"
ROOM="${1:-test-live-mcbuleli}"
TARGET="${ROOM}@${CONFERENCE}"

MEET_CFG="/etc/jitsi/meet/${DOMAIN}-config.js"
IFACE_CFG="/etc/jitsi/meet/${DOMAIN}-interface_config.js"
PROSODY_CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$PROSODY_CFG" ]] || PROSODY_CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"
PROSODY_MAIN="/etc/prosody/prosody.cfg.lua"
JICOFO_CFG="/etc/jitsi/jicofo/jicofo.conf"
JVB_CFG="/etc/jitsi/videobridge/jvb.conf"
NGINX_SNIP="/etc/nginx/snippets/mcbuleli-xmpp-proxy.conf"

FAIL=0
pass() { echo "  [PASS] $*"; }
fail() { echo "  [FAIL] $*"; FAIL=$((FAIL + 1)); }
warn() { echo "  [WARN] $*"; }
info() { echo "  [INFO] $*"; }
section() { echo ""; echo "========== $* =========="; }

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }

section "A. Domain mapping (expected single-tenant)"
info "domain=${DOMAIN} muc=${CONFERENCE} focus=${FOCUS} auth=${AUTH}"

section "B. Secondary MUC / stray Prosody configs"
STRAY_PATTERNS=(
  "conference.mcbuleli.org"
  "conference.meet."
  "conference.guest."
  "guest.${DOMAIN}"
  "lobby.${DOMAIN}"
  "jigasi.meet.jitsi"
  "jaas."
  "internal.auth.meet"
)

for pat in "${STRAY_PATTERNS[@]}"; do
  hits="$(grep -rl "$pat" /etc/prosody/conf.d/ /etc/prosody/conf.avail/ 2>/dev/null | grep -v '.disabled' || true)"
  if [[ -n "$hits" ]]; then
    if [[ "$pat" == "guest.${DOMAIN}" || "$pat" == "lobby.${DOMAIN}" ]]; then
      active="$(grep -lE "^VirtualHost \"${pat}\"" $hits 2>/dev/null || true)"
      if [[ -n "$active" ]]; then
        fail "Active VirtualHost ${pat} in: $active"
      else
        pass "${pat} only commented/absent"
      fi
    else
      fail "Stray pattern '${pat}' in: $hits"
    fi
  else
    pass "No active config for '${pat}'"
  fi
done

# Duplicate cfg.lua for same domain
DUP_CFG="$(find /etc/prosody/conf.d /etc/prosody/conf.avail -name '*.cfg.lua' 2>/dev/null \
  | xargs grep -l "VirtualHost \"${DOMAIN}\"" 2>/dev/null | sort -u || true)"
DUP_N="$(echo "$DUP_CFG" | grep -c . || true)"
if [[ "$DUP_N" -gt 2 ]]; then
  warn "VirtualHost ${DOMAIN} in ${DUP_N} files (conf.d + conf.avail expected):"
  echo "$DUP_CFG"
else
  pass "Prosody domain cfg in expected files only (${DUP_N})"
fi

section "C. config.js + interface_config.js (on disk)"
[[ -f "$MEET_CFG" ]] || fail "Missing $MEET_CFG"

for key domain muc focus; do
  case $key in
    domain) exp="$DOMAIN" ;;
    muc) exp="$CONFERENCE" ;;
    focus) exp="$FOCUS" ;;
  esac
  if tail -50 "$MEET_CFG" | grep -qE "hosts\.${key}\s*=\s*'${exp}'"; then
    pass "config.hosts.${key} = ${exp} (final block)"
  elif grep -qE "hosts\.${key}.*${exp}" "$MEET_CFG"; then
    warn "config.hosts.${key} references ${exp} but not in final override"
  else
    fail "config.hosts.${key} not set to ${exp}"
  fi
done

if tail -50 "$MEET_CFG" | grep -qE 'delete config\.hosts\.anonymousdomain|//.*anonymousdomain'; then
  if tail -50 "$MEET_CFG" | grep -qE "config\.hosts\.anonymousdomain\s*="; then
    fail "anonymousdomain re-assigned after delete"
  else
    pass "anonymousdomain removed"
  fi
else
  if grep -qE "anonymousdomain.*${GUEST}" "$MEET_CFG"; then
    fail "anonymousdomain=${GUEST} ACTIVE → split MUC"
  else
    warn "anonymousdomain state ambiguous on disk"
  fi
fi

MCB_COUNT="$(grep -cE '// mcbuleli-' "$MEET_CFG" 2>/dev/null || echo 0)"
if [[ "$MCB_COUNT" -gt 1 ]]; then
  fail "${MCB_COUNT} mcbuleli-* blocks in config.js (sprawl)"
  grep -n '// mcbuleli-' "$MEET_CFG" | head -10
elif [[ "$MCB_COUNT" -eq 1 ]]; then
  pass "Single mcbuleli override block"
else
  warn "No mcbuleli baseline marker — run fix-live-master.sh"
fi

if grep -qE "^var subdomain = ''" "$MEET_CFG" || grep -q "subdomain = ''" "$MEET_CFG"; then
  pass "subdomain = '' (no multi-tenant MUC suffix)"
else
  warn "subdomain not forced empty"
fi

node --check "$MEET_CFG" 2>/dev/null && pass "config.js syntax OK" || fail "config.js SyntaxError"

section "D. config.js SERVED (browser receives)"
SERVED="$(curl -sf "https://${DOMAIN}/config.js" 2>/dev/null || true)"
[[ -n "$SERVED" ]] || fail "Cannot fetch https://${DOMAIN}/config.js"

echo "$SERVED" | grep -E 'hosts\.(domain|muc|focus|anonymousdomain)' | tail -8
MUC_SERVED="$(echo "$SERVED" | grep 'hosts.muc' | tail -1)"
FOCUS_SERVED="$(echo "$SERVED" | grep 'hosts.focus' | tail -1)"
BOSH_SERVED="$(echo "$SERVED" | grep -E 'config\.bosh|bosh:' | tail -1)"
WSS_SERVED="$(echo "$SERVED" | grep 'websocket' | tail -1)"

echo "$MUC_SERVED" | grep -q "$CONFERENCE" && pass "Served muc=${CONFERENCE}" || fail "Served muc wrong: ${MUC_SERVED:-MISSING}"
echo "$SERVED" | grep -qE "anonymousdomain.*${GUEST}" && fail "Served anonymousdomain=${GUEST}" || pass "Served: no guest anonymousdomain"
echo "$BOSH_SERVED" | grep -q "${DOMAIN}/http-bind" && pass "Served bosh points to ${DOMAIN}" || warn "Served bosh: ${BOSH_SERVED:-MISSING}"
echo "$WSS_SERVED" | grep -q "${DOMAIN}/xmpp-websocket" && pass "Served websocket wss://${DOMAIN}" || warn "Served websocket: ${WSS_SERVED:-MISSING}"

PREJOIN_LAST="$(echo "$SERVED" | grep -iE 'prejoinPageEnabled|prejoinConfig' | tail -1)"
echo "$PREJOIN_LAST" | grep -qiE 'true|enabled:\s*true' && \
  warn "prejoin still enabled in served config → ping-only risk: $PREJOIN_LAST" || \
  pass "prejoin disabled in served config"

section "E. Prosody VirtualHosts + Components"
prosodyctl check config 2>&1 | tail -3 || warn "prosodyctl check config warnings"

for comp in "$CONFERENCE" "$FOCUS" "$INTERNAL"; do
  grep -q "Component \"${comp}\"" "$PROSODY_CFG" && pass "Component ${comp}" || fail "Missing Component ${comp}"
done

grep -A30 "VirtualHost \"${DOMAIN}\"" "$PROSODY_CFG" | grep -q 'authentication = "token"' && \
  pass "VirtualHost ${DOMAIN} token auth" || fail "VirtualHost ${DOMAIN} not token auth"

grep -A40 "VirtualHost \"${DOMAIN}\"" "$PROSODY_CFG" | grep -q 'enable_domain_verification = false' && \
  pass "enable_domain_verification = false" || warn "enable_domain_verification not false"

grep -A20 "Component \"${CONFERENCE}\"" "$PROSODY_CFG" | grep -q token_verification && \
  pass "MUC token_verification enabled" || fail "MUC missing token_verification"

grep -q 'muc_lobby_rooms' "$PROSODY_CFG" && fail "muc_lobby_rooms still enabled" || pass "muc_lobby_rooms absent"
grep -qE '^VirtualHost "'"${GUEST}"'"' "$PROSODY_CFG" && fail "guest vhost ACTIVE" || pass "guest vhost off"
grep -qE '^VirtualHost "'"${LOBBY}"'"' "$PROSODY_CFG" && fail "lobby vhost ACTIVE" || pass "lobby vhost off"

section "F. nginx XMPP routes"
NGINX_VHOST=""
for f in /etc/nginx/sites-enabled/${DOMAIN}.conf /etc/nginx/sites-enabled/${DOMAIN}; do
  [[ -f "$f" ]] && NGINX_VHOST="$f" && break
done
[[ -n "$NGINX_VHOST" ]] || fail "nginx vhost for ${DOMAIN} not found"

HTTP_BIND_COUNT="$(grep -c 'location.*http-bind' "$NGINX_VHOST" 2>/dev/null || echo 0)"
[[ "$HTTP_BIND_COUNT" -le 1 ]] && pass "Single /http-bind location (${HTTP_BIND_COUNT})" || \
  fail "Duplicate /http-bind (${HTTP_BIND_COUNT}) → XMPP broken"

[[ -f "$NGINX_SNIP" ]] && pass "mcbuleli-xmpp-proxy.conf exists" || fail "Missing $NGINX_SNIP"
for path in /http-bind /xmpp-websocket; do
  code="$(curl -sI -o /dev/null -w '%{http_code}' "https://${DOMAIN}${path}" 2>/dev/null || echo 000)"
  [[ "$code" != "502" && "$code" != "000" ]] && pass "${path} HTTP ${code}" || fail "${path} HTTP ${code}"
done

section "G. Jicofo + JVB"
for key in \
  "conference-muc-jid = \"${CONFERENCE}\"" \
  "client-proxy = \"${FOCUS}\"" \
  "xmpp-domain = \"${DOMAIN}\""; do
  grep -qF "$key" "$JICOFO_CFG" 2>/dev/null && pass "jicofo: $key" || fail "jicofo missing: $key"
done

FOCUS_C2S=$(prosodyctl shell c2s show "${AUTH}" 2>/dev/null | grep -ci focus 2>/dev/null || true)
FOCUS_C2S=${FOCUS_C2S:-0}
[[ "$FOCUS_C2S" -ge 1 ]] && pass "focus@${AUTH} connected (${FOCUS_C2S})" || fail "focus@${AUTH} not connected"
[[ "$FOCUS_C2S" -le 1 ]] && pass "Single focus session" || fail "Multiple focus sessions (${FOCUS_C2S}) → stale proxy"

grep -qiE 'Registered|Added new videobridge' /var/log/jitsi/jicofo.log 2>/dev/null && \
  pass "Jicofo Registered + bridge" || warn "Jicofo not fully registered"

section "H. Live MUC state (${TARGET})"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LUA_SNIP="${SCRIPT_DIR}/lib-prosody-muc-shell.lua"
LUA_RUN="/tmp/mcb-muc-audit-${ROOM}.lua"
REPORT="/tmp/mcb-muc-report-${ROOM}.txt"
if [[ -f "$LUA_SNIP" ]] && command -v expect >/dev/null 2>&1; then
  sed -e "s|@@MCB_CONFERENCE@@|${CONFERENCE}|g" -e "s|@@MCB_ROOM@@|${ROOM}|g" \
    "$LUA_SNIP" > "$LUA_RUN"
  expect <<EXPECT 2>&1 >/dev/null || true
set timeout 20
spawn prosodyctl shell
expect "prosody>"
send "> return (loadfile('${LUA_RUN}'))()\r"
expect "prosody>"
send "bye\r"
expect eof
EXPECT
  if [[ -f "$REPORT" ]]; then
    cat "$REPORT"
    grep -q "target_FOUND" "$REPORT" && pass "Room ${TARGET} exists" || warn "Room ${TARGET} not created yet"
    if grep -q "SPLIT_HOST" "$REPORT"; then
      fail "Secondary MUC with occupants detected (split room)"
      grep "SPLIT_HOST" "$REPORT"
    else
      pass "No secondary conference.* MUC with occupants"
    fi
    OCC="$(grep -oE 'occupant_count=[0-9]+' "$REPORT" | tail -1 || true)"
    info "Current: ${OCC:-occupant_count=0}"
  else
    warn "MUC shell report unavailable"
  fi
else
  prosodyctl shell muc room "${TARGET}" 2>&1 | tail -3 || warn "Room ${TARGET} absent"
fi

# Recent auth domain check
if grep -i "Authenticated.*@guest\." /var/log/prosody/prosody.log 2>/dev/null | tail -1 | grep -q .; then
  fail "Recent auth on guest.* domain"
  grep -i "Authenticated.*@guest\." /var/log/prosody/prosody.log | tail -3
else
  pass "No recent guest.* authentications"
fi

section "I. DNS / hostname consistency"
for host in "$DOMAIN" "$CONFERENCE" "$FOCUS" "$AUTH"; do
  if getent hosts "$host" >/dev/null 2>&1 || host "$host" 2>/dev/null | grep -q 'has address'; then
    pass "DNS resolves: ${host}"
  else
    warn "DNS lookup failed: ${host} (may be same cert SAN)"
  fi
done

section "VERDICT"
if [[ "$FAIL" -eq 0 ]]; then
  echo "AUDIT PASS (${FAIL} failures) — stack aligned for single MUC ${CONFERENCE}"
  echo "If users still split: client-side (ping-only, hash SyntaxError, browser cache)"
  echo "  → sudo bash ops/jitsi/fix-ping-only.sh ${ROOM}"
  echo "  → sudo bash ops/jitsi/capture-muc-join.sh ${ROOM}  (during active join)"
  exit 0
else
  echo "AUDIT FAIL (${FAIL} failures) — run: sudo bash ops/jitsi/fix-live-master.sh ${ROOM}"
  exit 1
fi
