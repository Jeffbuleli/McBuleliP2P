#!/bin/bash
# Jicofo XmlPullParserException sur gros disco#info — limites JVM XML (JSA-2022-0002).
set -euo pipefail

JICOFO_CFG="/etc/jitsi/jicofo/config"
MARKER="mcbuleli-jvm-xml-limits"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$JICOFO_CFG" ]] || { echo "FAIL: $JICOFO_CFG absent"; exit 1; }

cp -a "$JICOFO_CFG" "${JICOFO_CFG}.bak.xmlimits.$(date +%Y%m%d%H%M%S)"

XML_PROPS=(
  "-Djdk.xml.entityExpansionLimit=0"
  "-Djdk.xml.maxOccurLimit=0"
  "-Djdk.xml.elementAttributeLimit=524288"
  "-Djdk.xml.totalEntitySizeLimit=0"
  "-Djdk.xml.maxXMLNameLimit=524288"
  "-Djdk.xml.entityReplacementLimit=0"
)

# Retirer anciennes props du même type
for prop in "${XML_PROPS[@]}"; do
  key="${prop%%=*}"
  sed -i "s|${key}=[^ \"']*||g" "$JICOFO_CFG" 2>/dev/null || true
done

if grep -q '^JICOFO_OPTS=' "$JICOFO_CFG"; then
  current="$(grep '^JICOFO_OPTS=' "$JICOFO_CFG" | head -1 | sed 's/^JICOFO_OPTS=//' | tr -d '"')"
  for prop in "${XML_PROPS[@]}"; do
    echo "$current" | grep -qF "${prop%%=*}" || current="${current} ${prop}"
  done
  sed -i "s|^JICOFO_OPTS=.*|JICOFO_OPTS=\"${current}\"|" "$JICOFO_CFG"
else
  echo "JICOFO_OPTS=\"${XML_PROPS[*]}\"" >> "$JICOFO_CFG"
fi

grep -q "$MARKER" "$JICOFO_CFG" || echo "# $MARKER" >> "$JICOFO_CFG"

echo "==> JICOFO_OPTS"
grep '^JICOFO_OPTS=' "$JICOFO_CFG" | head -1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/fix-jicofo-zombie.sh" ]]; then
  bash "$SCRIPT_DIR/fix-jicofo-zombie.sh"
else
  systemctl restart jicofo
  sleep 8
fi

echo ""
echo "==> Jicofo (pas de XmlPullParserException récent ?)"
grep -iE 'XmlPullParser|XMLStreamException|Registered|SEVERE' /var/log/jitsi/jicofo.log 2>/dev/null | tail -8 || true

echo ""
echo "OK — retest capture-muc-join après join"
