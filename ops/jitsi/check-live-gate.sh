#!/bin/bash
# Diagnostic rapide gate live.mcbuleli.org
set -euo pipefail

echo "==> HTTP public"
curl -sI "https://live.mcbuleli.org/" | head -4
echo "---"
curl -sI "https://live.mcbuleli.org/test-live-mcbuleli" | head -4
echo "---"
curl -sI "https://live.mcbuleli.org/images/mcbuleli-meet-watermark.png" | head -4

SNIPPET=/etc/nginx/snippets/mcbuleli-live-gate.conf
VHOST=""
for f in /etc/nginx/sites-enabled/live.mcbuleli.org.conf \
         /etc/nginx/sites-enabled/live.mcbuleli.org; do
  [[ -f "$f" ]] && VHOST="$f" && break
done

echo ""
echo "==> Snippet: $SNIPPET"
if [[ -f "$SNIPPET" ]]; then
  cat "$SNIPPET"
else
  echo "(absent)"
fi

echo ""
echo "==> Include dans vhost"
if [[ -n "$VHOST" ]]; then
  grep -n 'mcbuleli-live-gate\|server_name' "$VHOST" || true
else
  echo "vhost introuvable"
fi

echo ""
echo "Réactiver: bash ops/jitsi/apply-nginx-live-gate.sh"
