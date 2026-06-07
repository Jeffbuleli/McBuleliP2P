#!/bin/bash
# Jicofo: XMLStreamException ParseError [1,713582] — disco#info Prosody trop gros.
# Cause: trop de Components Jitsi (polls, speakerstats, breakout, etc.) → focus déco → service-unavailable.
set -euo pipefail

DOMAIN="${JITSI_DOMAIN:-live.mcbuleli.org}"
AUTH="auth.${DOMAIN}"
CONFERENCE="conference.${DOMAIN}"
FOCUS_COMP="focus.${DOMAIN}"
INTERNAL="internal.${AUTH}"
CFG="/etc/prosody/conf.d/${DOMAIN}.cfg.lua"
[[ -f "$CFG" ]] || CFG="/etc/prosody/conf.avail/${DOMAIN}.cfg.lua"
JICOFO_CFG="/etc/jitsi/jicofo/config"
JVB_CFG="/etc/jitsi/videobridge/config"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
[[ -f "$CFG" ]] || { echo "FAIL: $CFG absent"; exit 1; }

mkdir -p /root/nginx-backups
cp -a "$CFG" "/root/nginx-backups/$(basename "$CFG").disco-bloat.$(date +%Y%m%d%H%M%S)"

# Composants McBuleli Live — uniquement l'essentiel (pas metadata/polls/etc.)
KEEP_COMPONENTS=(
  "$CONFERENCE"
  "$FOCUS_COMP"
  "$INTERNAL"
)

python3 - "$CFG" "$DOMAIN" "${KEEP_COMPONENTS[@]}" <<'PY'
import re, sys

path = sys.argv[1]
domain = sys.argv[2]
keep = set(sys.argv[3:])

text = open(path).read()
changed = []

def is_commented_line(line):
    return line.lstrip().startswith("--")

def comment_component_block(src, comp_name):
    esc = re.escape(comp_name)
    # Format Jitsi: Component "name" "type" (souvent une seule ligne)
    pat_line = rf'(?m)^(\s*)(Component "{esc}"(?:\s+"[^"]+")?\s*)$'
    m = re.search(pat_line, src)
    if m and not is_commented_line(m.group(0)):
        repl = f'{m.group(1)}-- mcbuleli-disco-trim: {m.group(2)}'
        return src[:m.start()] + repl + src[m.end():], True

    # Bloc multi-lignes (ex. conference avec options muc)
    pat_block = rf'(?m)^(\s*)Component "{esc}"'
    m = re.search(pat_block, src)
    if not m or is_commented_line(m.group(0)):
        return src, False
    start = m.start()
    tail = src[m.end():]
    nxt = re.search(r'\n(?!\s)(?:VirtualHost|Component)\s+"', tail)
    end = m.end() + (nxt.start() if nxt else len(tail))
    block = src[start:end]
    commented = "\n".join(
        ("-- mcbuleli-disco-trim: " + line if line.strip() and not is_commented_line(line) else line)
        for line in block.splitlines()
    )
    return src[:start] + commented + src[end:], True

for comp in re.findall(r'(?m)^(?!\s*--)\s*Component "([^"]+)"', text):
    if comp in keep:
        continue
    if domain not in comp and "auth." not in comp:
        continue
    text, did = comment_component_block(text, comp)
    if did:
        changed.append(comp)

vh_pat = rf'(VirtualHost "{re.escape(domain)}"\s*\n)(.*?)(?=\n(?:VirtualHost|Component)\s|\Z)'
optional_mods = (
    "speakerstats", "room_metadata", "conference_duration", "end_conference",
    "av_moderation", "filesharing", "breakout_rooms", "polls",
)

def trim_vhost(m):
    body = m.group(2)
    for mod in optional_mods:
        body = re.sub(rf'(?m)^\s*"{re.escape(mod)}";\s*\n', "", body)
    return m.group(1) + body

text = re.sub(vh_pat, trim_vhost, text, count=1, flags=re.DOTALL)

open(path, "w").write(text)
print("OK: commented optional components:", ", ".join(changed) if changed else "(aucun nouveau)")
for k in sorted(keep):
    print(f"KEEP: {k}")
PY

echo ""
echo "==> prosodyctl check"
prosodyctl check config

echo ""
echo "==> JVM XML limits"
SKIP_RESTART=1 bash "$SCRIPT_DIR/fix-jicofo-jvm-xml-limits.sh" || true
if [[ -f "$JICOFO_CFG" ]] && grep -q '^JICOFO_OPTS=' "$JICOFO_CFG"; then
  sed -i 's/jdk.xml.elementAttributeLimit=[0-9]*/jdk.xml.elementAttributeLimit=0/g' "$JICOFO_CFG"
  sed -i 's/jdk.xml.maxXMLNameLimit=[0-9]*/jdk.xml.maxXMLNameLimit=0/g' "$JICOFO_CFG"
fi

echo ""
echo "==> Resync mdp focus/jvb (évite not-authorized, sans regénérer)"
FOCUS_PASS="$(grep '^JICOFO_AUTH_PASSWORD=' "$JICOFO_CFG" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"')"
JVB_PASS="$(grep '^JVB_AUTH_PASSWORD=' "$JVB_CFG" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"')"
if [[ -n "$FOCUS_PASS" ]]; then
  prosodyctl deluser "focus@${AUTH}" 2>/dev/null || true
  prosodyctl register focus "$AUTH" "$FOCUS_PASS"
fi
if [[ -n "$JVB_PASS" ]]; then
  prosodyctl deluser "jvb@${AUTH}" 2>/dev/null || true
  prosodyctl register jvb "$AUTH" "$JVB_PASS"
fi

LOG_LINES="$(wc -l < /var/log/jitsi/jicofo.log 2>/dev/null || echo 0)"

echo ""
echo "==> Restart Prosody puis Jicofo"
systemctl stop jicofo 2>/dev/null || true
systemctl restart prosody
sleep 8
systemctl restart jicofo
sleep 15

echo ""
echo "==> Components actifs restants (attendu: conference, internal.auth, focus)"
grep -E '^\s*Component "' "$CFG" | grep -v '^--' || true

echo ""
echo "==> Jicofo depuis restart (pas d'anciennes erreurs)"
tail -n +"$((LOG_LINES + 1))" /var/log/jitsi/jicofo.log 2>/dev/null | \
  grep -iE 'XMLStreamException|ParseError|not-authorized|Registered|SEVERE' | tail -12 || true

if tail -n +"$((LOG_LINES + 1))" /var/log/jitsi/jicofo.log 2>/dev/null | \
   grep -qiE 'XMLStreamException|ParseError'; then
  echo ""
  echo "FAIL: ParseError encore présent après trim — coller sortie ci-dessus"
  exit 1
fi

if ! tail -n +"$((LOG_LINES + 1))" /var/log/jitsi/jicofo.log 2>/dev/null | grep -q 'Registered'; then
  echo "FAIL: Jicofo pas Registered — tail -30 /var/log/jitsi/jicofo.log"
  exit 1
fi

echo ""
echo "OK — focus stable. Test:"
echo "  1) Fermer tous onglets live.mcbuleli.org"
echo "  2) sudo bash ops/jitsi/gen-live-join-url.sh test-live-mcbuleli"
echo "  3) Chrome privé top-level + Cmd+Shift+R"
