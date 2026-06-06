#!/bin/bash
# jigasi.meet.jitsi encore actif → muc_domain_mapper parasite, mauvais bosh.
set -euo pipefail

DISABLED="/root/nginx-backups/jigasi-kill-$(date +%Y%m%d%H%M%S)"
[[ "$(id -u)" -eq 0 ]] || { echo "Run as root"; exit 1; }
mkdir -p "$DISABLED"

echo "==> Fichiers contenant jigasi.meet.jitsi"
grep -rl 'jigasi\.meet\.jitsi' /etc/prosody/ 2>/dev/null | while read -r f; do
  echo "DISABLE: $f"
  cp -a "$f" "$DISABLED/"
  case "$f" in
    */conf.d/*)
      rm -f "$f"
      ;;
    */conf.avail/*)
      mv -f "$f" "$DISABLED/$(basename "$f").disabled"
      ;;
  esac
done

for CFG in /etc/prosody/conf.d/live.mcbuleli.org.cfg.lua \
           /etc/prosody/conf.avail/live.mcbuleli.org.cfg.lua; do
  [[ -f "$CFG" ]] || continue
  python3 - "$CFG" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path).read()
for name in ("jigasi.meet.jitsi", "meet.jitsi", "auth.meet.jitsi"):
    pat = rf'(?m)^(\s*)(VirtualHost|Component) "{re.escape(name)}"\s*$'
    while re.search(pat, text):
        m = re.search(pat, text)
        start = m.start()
        tail = text[m.end():]
        nxt = re.search(r'\n(?=(?:VirtualHost|Component) ")', tail)
        end = m.end() + (nxt.start() if nxt else len(tail))
        block = text[start:end]
        if block.lstrip().startswith("--"):
            break
        commented = "\n".join(
            ("-- " + ln) if ln.strip() and not ln.lstrip().startswith("--") else ln
            for ln in block.splitlines()
        )
        text = text[:start] + commented + text[end:]
        print("commented", name, "in", path)
open(path, "w").write(text)
PY
done

systemctl stop jigasi 2>/dev/null || true
systemctl disable jigasi 2>/dev/null || true
prosodyctl check config 2>&1 | tail -8 || true
systemctl restart prosody
sleep 3

echo ""
echo "==> jigasi dans logs récents (doit être vide)"
grep -i 'jigasi\.meet' /var/log/prosody/prosody.log | tail -3 || echo "OK: aucun"
