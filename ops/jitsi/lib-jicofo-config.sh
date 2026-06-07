#!/bin/bash
# Helpers — /etc/jitsi/jicofo/config doit garder -Dconfig.file=jicofo.conf (sinon hocon ignoré).
set -euo pipefail

JICOFO_VCFG="${JICOFO_VCFG:-/etc/jitsi/jicofo/config}"
JICOFO_HOCON="${JICOFO_HOCON:-/etc/jitsi/jicofo/jicofo.conf}"

mcbuleli_ensure_jicofo_runtime_config() {
  local xmpp_host="${1:-127.0.0.1}"
  local auth="${2:?auth domain}"
  local focus_pass="${3:?focus password}"

  local ts java_props current key val kv
  ts="$(date +%Y%m%d%H%M%S)"
  [[ -f "$JICOFO_VCFG" ]] && cp -a "$JICOFO_VCFG" "${JICOFO_VCFG}.bak.${ts}"

  java_props="-Dconfig.file=${JICOFO_HOCON}"
  java_props+=" -Dnet.java.sip.communicator.SC_HOME_DIR_LOCATION=/etc/jitsi"
  java_props+=" -Dnet.java.sip.communicator.SC_HOME_DIR_NAME=jicofo"
  java_props+=" -Dnet.java.sip.communicator.SC_LOG_DIR_LOCATION=/var/log/jitsi"
  java_props+=" -Djava.util.logging.config.file=/etc/jitsi/jicofo/logging.properties"

  for kv in "JICOFO_HOST=${xmpp_host}" "JICOFO_AUTH_DOMAIN=${auth}" "JICOFO_AUTH_USER=focus" "JICOFO_AUTH_PASSWORD=${focus_pass}"; do
    key="${kv%%=*}"; val="${kv#*=}"
    if grep -q "^${key}=" "$JICOFO_VCFG" 2>/dev/null; then
      sed -i "s|^${key}=.*|${key}=${val}|" "$JICOFO_VCFG"
    else
      echo "${key}=${val}" >> "$JICOFO_VCFG"
    fi
  done

  if grep -q '^JICOFO_OPTS=' "$JICOFO_VCFG" 2>/dev/null; then
    current="$(grep '^JICOFO_OPTS=' "$JICOFO_VCFG" | head -1 | sed 's/^JICOFO_OPTS=//' | tr -d '"')"
    echo "$current" | grep -q '\-Dconfig\.file=' || current="${java_props} ${current}"
    sed -i "s|^JICOFO_OPTS=.*|JICOFO_OPTS=\"${current}\"|" "$JICOFO_VCFG"
  else
    echo "JICOFO_OPTS=\"${java_props}\"" >> "$JICOFO_VCFG"
  fi

  grep -q 'mcbuleli-jicofo-runtime' "$JICOFO_VCFG" 2>/dev/null || echo "# mcbuleli-jicofo-runtime" >> "$JICOFO_VCFG"
}

mcbuleli_jicofo_process_has_config_file() {
  local pid
  pid="$(pgrep -f 'org.jitsi.jicofo|jicofo\.jar' 2>/dev/null | head -1 || true)"
  [[ -n "$pid" ]] || return 1
  tr '\0' ' ' < "/proc/${pid}/cmdline" 2>/dev/null | grep -q '\-Dconfig\.file=.*jicofo\.conf'
}
