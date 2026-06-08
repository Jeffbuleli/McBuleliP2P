# Live McBuleli — playbook ordonné

**Ordre de lecture** : [docs/academy-live-lifecycle.md](../../docs/academy-live-lifecycle.md) (produit) → ce fichier (VPS).

## Où on en est (juin 2026)

| Couche | Statut |
|--------|--------|
| App : `live_started_at`, waiting host, JWT par compte | ✅ |
| Prosody : JWT, token_verification MUC, lobby/breakout off | ✅ (après dedupe) |
| Client : config.js prejoin off, IQ conference envoyée | ✅ |
| **focus → Jicofo** (`client_proxy`) | ✅ IQ focus OK (`Adding focus JID`) |
| Crash UI `isLobbySupported` | ❌ `enableLobby=false` → fix `fix-lobby-ui-crash.sh` |
| MUC commune host+user | ✅ `occupant_count=2` |
| Branding McBuleli (watermark, notifications) | `apply-mcbuleli-brand.sh` |

---

## Deux modes de test (ne pas mélanger)

### A — Test produit (valide McBuleli)

```
Host + User : comptes McBuleli → companion → /app/live/enter → Jitsi
VPS         : check-muc-live.sh → occupant_count=2
```

### B — Test infra isolé (ops seulement)

```
VPS : gen-live-join-url.sh → Chrome privé top-level
      capture-muc-join.sh pendant le join
```

Le mode B **ne remplace pas** A pour la sécurité ni le parcours host/user.

---

## Séquence VPS — avant chaque session de test

```bash
cd ~/McBuleliP2P && git pull

# 1. Config Prosody canonique
sudo bash ops/jitsi/fix-prosody-dedupe-cfg.sh

# 2. Focus + client_proxy + jicofo.conf
sudo bash ops/jitsi/fix-focus-iq-route.sh
# Si le script s'arrête sur "Problems found" prosodyctl check → finir à la main :
#   sudo systemctl restart prosody && sleep 8
#   sudo systemctl restart jitsi-videobridge2 && sleep 8
#   sudo systemctl restart jicofo && sleep 15

# 3. Si service-unavailable persiste malgré focus@auth online
sudo bash ops/jitsi/fix-focus-roster-subscribe.sh
# ou séquence complète :
sudo bash ops/jitsi/fix-focus-client-proxy-sessions.sh

# 4. Lobby UI crash (isLobbySupported) après focus OK
sudo bash ops/jitsi/fix-lobby-ui-crash.sh

# 5. Branding (watermark coin vidéo, notifications McBuleli)
sudo bash ops/jitsi/apply-mcbuleli-brand.sh

# 6. Vérif
sudo prosodyctl shell c2s show auth.live.mcbuleli.org | grep focus@
sudo grep -iE 'registered new target session|no sessions to send' \
  /var/log/prosody/prosody.log | tail -10
```

Attendu :

- 1 session `focus@auth`
- `registered new target session: focus` dans prosody.log (idéal)
- pas de `no sessions to send` au moment du join

---

## Pendant le join

```bash
# Terminal 1
sudo tail -f /var/log/jitsi/jicofo.log | grep -iE 'Allocated|Creating|SEVERE|XMLStream'

# Terminal 2 (mode B seulement)
sudo bash ops/jitsi/capture-muc-join.sh <room>

# Après join
sudo bash ops/jitsi/check-muc-live.sh <room>
```

| Signal | Signification |
|--------|---------------|
| IQ focus `type=result` | client_proxy OK |
| `service-unavailable` | client_proxy sessions[] vide ou focus KO |
| `Allocated` | Jicofo a créé la conférence |
| `occupant_count=2` | **succès produit** |

---

## Scripts par symptôme

| Symptôme | Script |
|----------|--------|
| Duplicate option Prosody | `fix-prosody-dedupe-cfg.sh` |
| service-unavailable + jicofo silencieux | `fix-focus-iq-route.sh` puis `fix-focus-client-proxy-sessions.sh` |
| focus@auth online mais IQ échoue encore | `fix-focus-hard-reset.sh` |
| Ping-only (auth OK, pas MUC) | `diagnose-ping-only-served.sh` → config.js OK = focus ou JS navigateur |
| ParseError col ~500k+ jicofo | `fix-focus-pre-join.sh` (dedupe + disco bloat) |
| Crash `isLobbySupported` après focus OK | `fix-lobby-ui-crash.sh` — retirer `enableLobby=false` |
| Split host/guest MUC | `audit-muc-fragmentation.sh` — ne pas réactiver guest vhost |

---

## Pièges connus

1. **`fix-focus-iq-route.sh` interrompu** — `prosodyctl check` warnings → restart jamais fait → finir restart à la main
2. **`gen-live-join-url` ≠ prod** — JWT test-host, pas de gate McBuleli
3. **Onglets Jitsi ouverts** — c2s fantômes ; fermer tous les onglets `live.mcbuleli.org` avant pre-join
4. **Verdict capture « join MUC détecté »** — peut être faux positif (IQ conference ≠ presence MUC) ; lire `service-unavailable` dans les stanzas
5. **`live_started_at`** — rituel host une seule fois par session DB ; pas lié à Jicofo Registered

---

## Références

- JWT : `jwt-setup.md`
- Split MUC : `SPLIT-ROOM-ROOT-CAUSE.md`, `MUC-UNIFICATION-REPORT.md`
- Produit : `docs/academy-live-lifecycle.md`
