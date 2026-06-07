# McBuleli Live — écarts vs Jitsi Handbook

Références : [Developer Guide](https://jitsi.github.io/handbook/docs/category/developer-guide/), [Configuration](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-configuration), [Architecture](https://jitsi.github.io/handbook/docs/architecture), [Token Authentication](https://jitsi.github.io/handbook/docs/devops-guide/token-authentication), [FAQ](https://jitsi.github.io/handbook/docs/faq).

---

## Ce que le handbook décrit (modèle JWT « classique »)

[Token Authentication](https://jitsi.github.io/handbook/docs/devops-guide/token-authentication) suppose :

1. Host avec JWT crée la room sur `domain`
2. **Invités rejoignent via `anonymousdomain` + `guest.*` VirtualHost**
3. `config.js` **doit** avoir `anonymousdomain: 'guest.domain'`
4. Modules optionnels : `muc_lobby_rooms`, `persistent_lobby`, `muc_wait_for_host`
5. **Jicofo : ne pas activer `authentication-enabled`** quand Prosody utilise `token`

### Écart McBuleli (volontaire)

McBuleli émet un **JWT pour host ET guest** sur `live.mcbuleli.org` (gate nginx).  
→ **Pas d'`anonymousdomain`**, pas de `guest.*` — sinon split MUC (documenté dans `SPLIT-ROOM-ROOT-CAUSE.md`).

**Ne pas suivre** la section handbook « Enable anonymous login for guests » sur notre VPS.

---

## Chaîne join (Architecture)

[Architecture](https://jitsi.github.io/handbook/docs/architecture) :

```
Client (conference.js) → IQ "conference request" → focus.DOMAIN (client_proxy)
                      → Jicofo (focus@auth) alloue conférence
                      → MUC conference.DOMAIN
                      → JVB (media)
```

Erreur console observée :

```
operation: conference request (IQ) → focus.live.mcbuleli.org → service-unavailable
Moderator: Failed to get a successful response
PreJoin rejected
```

→ Le client fait la bonne étape handbook ; le blocage est **focus/Jicofo**, pas le MUC split.

---

## Configuration client ([dev-guide-configuration](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-configuration))

| Option handbook | Valeur attendue McBuleli | Risque si faux |
|-----------------|--------------------------|----------------|
| `hosts.domain` | `live.mcbuleli.org` | Auth sur mauvais vhost |
| `hosts.muc` | `conference.live.mcbuleli.org` | Split room |
| `hosts.focus` | `focus.live.mcbuleli.org` | IQ vers mauvais composant |
| `hosts.anonymousdomain` | **absent** (McBuleli) | Split host/guest si présent |
| `bosh` | `https://live.../http-bind` | c2s insecure |
| `websocket` | `wss://live.../xmpp-websocket` | ping-only |
| `lobby.*` / `enableLobby` | `false` | invité en lobby séparé |
| `prejoinPageEnabled` | `false` | join jamais déclenché |
| `requireDisplayName` | `false` | blocage pré-join |

Handbook : *« If you need to separate users into different domains, use Visitors / Lobby / JWT roles »* — pas `anonymousdomain` avec JWT McBuleli unifié.

---

## Ce qui nous échappait probablement

### 1. `muc_access_whitelist` + `admins` sur le Component MUC (FAQ)

[FAQ](https://jitsi.github.io/handbook/docs/faq) exige sur `conference.*` :

```lua
muc_access_whitelist = { "focus@auth.live.mcbuleli.org" }
admins = { "focus@auth.live.mcbuleli.org" }
muc_room_locking = false
muc_room_default_public_jids = true
```

**Fix :** `sudo bash ops/jitsi/fix-muc-focus-whitelist.sh`

### 2. `muc_wait_for_host` (Token Authentication handbook)

Si présent sur le Component MUC (paquet `jitsi-meet-tokens`), les invités **attendent le host** — symptôme proche du split.  
`fix-muc-focus-whitelist.sh` le retire.

### 3. Jicofo auth activée par erreur

Handbook : *« authentication must be disabled in jicofo.conf when token authentication is active »*.  
Vérifier : pas de `authentication-enabled=true` dans `/etc/jitsi/jicofo/jicofo.conf`.

### 4. Reverse proxy WebSocket ([Docker guide](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-docker))

`/xmpp-websocket` et `/colibri-ws/` doivent être proxifiés avec Upgrade.  
McBuleli : **OK** (`curl -I` → 200).

### 5. Modèle handbook guest ≠ McBuleli

Réactiver `fix-prosody-jwt-guest.sh` ou `anonymousdomain` **contredit** le handbook JWT **et** casse McBuleli.

### 6. Plugins Prosody JWT optionnels ([Third-Party](https://jitsi.github.io/handbook/docs/community/third-party-software))

- `token_lobby_bypass` — utile si lobby actif ; McBuleli met `lobby_bypass: true` dans le JWT Render
- `token_owner_party` — peut terminer la conf quand le owner part
- Non installés par défaut sur VPS Debian

### 7. Côté app / navigateur (hors handbook)

- Join dans **iframe** → CORS `mcbuleli.org/login` (gate nginx)
- **4+ c2s** = onglets périmés
- URL sans `?jwt=` → gate redirige vers login

**Test handbook-compatible :** `gen-live-join-url.sh` en onglet top-level.

### 8. Media A/V (FAQ — autre symptôme)

[FAQ](https://jitsi.github.io/handbook/docs/faq) : NAT, UDP 10000, `muc_access_whitelist` si « connectés mais pas de son/image ».  
Pas notre cas actuel (`service-unavailable` avant MUC).

---

## Checklist après redeploy Render

```bash
cd ~/McBuleliP2P && git pull

sudo bash ops/jitsi/fix-muc-focus-whitelist.sh
sudo bash ops/jitsi/fix-focus-hard-reset.sh
sudo bash ops/jitsi/diagnose-ping-only-served.sh test-live-mcbuleli
sudo bash ops/jitsi/verify-focus-chain.sh
```

Navigateur : URL `gen-live-join-url` · fenêtre privée · top-level · `?jwt=` visible · `Cmd+Shift+R`.

Succès : plus de `service-unavailable`, `watch-join-live` montre `Allocated`, `occupant_count=2`.
