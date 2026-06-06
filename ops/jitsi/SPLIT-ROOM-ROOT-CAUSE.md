# Split room McBuleli Live — cause racine et correction

Domaine : `live.mcbuleli.org`  
Symptôme : host et guest sur la même URL (`/test-live-mcbuleli`) voient chacun **1 participant** — deux « LIVE » séparés.

---

## Cause racine #1 (confirmée dans le repo) : `fix-prosody-jwt-guest.sh`

**Fichier fautif :** `ops/jitsi/fix-prosody-jwt-guest.sh`  
**Appelé par :** `ops/jitsi/apply-jitsi-jwt.sh` (et donc `deploy-live-vps.sh` si secret présent)

Ce script **réactive** le split host/guest :

| Ligne / action | Effet |
|----------------|-------|
| L.62–83 Prosody | Recrée `VirtualHost "guest.live.mcbuleli.org"` avec `authentication = "jitsi-anonymous"` |
| L.93–105 config.js | Décommente / ajoute `anonymousdomain: 'guest.live.mcbuleli.org'` |

Avec `anonymousdomain`, Jitsi Meet envoie les invités (souvent `moderator: false`) vers **`guest.live.mcbuleli.org`** au lieu de **`live.mcbuleli.org`**. Les MUC deviennent :

- Host → `test-live-mcbuleli@conference.live.mcbuleli.org`
- Guest (anonymous) → souvent `test-live-mcbuleli@conference.guest.live.mcbuleli.org` ou auth sur guest domain

**Même URL navigateur, deux arbre XMPP différents.**

McBuleli émet un **JWT pour host et guest** via la gate nginx → le mode « guest domain » Jitsi classique est **inutile et nuisible**.

**Correction :** `fix-prosody-jwt-main-only.sh` + `apply-jitsi-jwt.sh` mis à jour pour ne plus appeler `fix-prosody-jwt-guest.sh`.

---

## Cause racine #2 : Lobby Prosody

**Fichiers :** `live.mcbuleli.org.cfg.lua` avec module `"muc_lobby_rooms"` et/ou `Component "lobby.live.mcbuleli.org"`

Si le lobby est actif côté serveur :

- Host (`moderator: true`) → MUC principale
- Guest (`moderator: false`) → **lobby** `lobby.live.mcbuleli.org` en attente

Résultat identique : **1 participant chacun**.

**Indices logs :**

```
Lobby component loaded lobby.live.mcbuleli.org
Loading mod_muc_lobby_rooms
```

**Correction client :** `lobby_bypass: true` dans le JWT (`src/lib/academy-jitsi-token.ts`) — **déployer sur Render**.  
**Correction serveur :** commenter VirtualHost lobby, retirer `muc_lobby_rooms`, `config.enableLobby = false`.

---

## Cause racine #3 : Sprawl de patches `mcbuleli-*`

Plusieurs scripts ont ajouté des blocs en fin de `config.js` :

- `mcbuleli-jwt-guest` → active guest
- `mcbuleli-jwt-only` / `mcbuleli-no-guest-split` → désactive guest
- `mcbuleli-same-room` / `mcbuleli-muc-fixed` → lobby + MUC

L’ordre d’exécution et le cache navigateur font que **le dernier bloc gagnant n’est pas prévisible**.

**Correction :** un seul marqueur `mcbuleli-live-baseline` via `fix-live-unified-baseline.sh`.

---

## Ce qui n’est PAS la cause du split

### `muc_domain_mapper`

Message log normal :

```
Loading mod_muc_domain_mapper
```

Module Prosody standard pour mapper les JID MUC. **Pas** un mode multi-tenant activé par erreur.

### `subdomain` dans config.js (template Jitsi)

```javascript
muc: 'conference.' + subdomain + 'live.mcbuleli.org'
```

Avec `subdomain = ''` (défaut sans préfixe URL), la MUC est `conference.live.mcbuleli.org`.  
Problème seulement si `subdomain` non vide (déploiement multi-tenant) **sans** override final `config.hosts.muc`.

### `No stream features to offer on insecure session`

Connexions **directes non-TLS** sur le port **5222** (bots, scans).  
Les navigateurs passent par **nginx** → `/xmpp-websocket` / `/http-bind` → Prosody **5280** avec `consider_websocket_secure = true`.

Bruit dans les logs, **pas** la cause du split. Réduire avec `c2s_interfaces = { "127.0.0.1", "::1" }`.

### Jigasi `kid claim is missing`

`jigasi.meet.jitsi` chargé via `jaas.cfg.lua` — hôte parasite.  
Erreur JWT Jigasi, **pas** le mécanisme du split room, mais à purger.

---

## Configuration cible (cohérence)

| Couche | Valeur |
|--------|--------|
| `config.hosts.domain` | `live.mcbuleli.org` |
| `config.hosts.muc` | `conference.live.mcbuleli.org` |
| `config.hosts.anonymousdomain` | **supprimé** |
| Prosody `VirtualHost "live.mcbuleli.org"` | `authentication = "token"` |
| Prosody `guest.*` / `lobby.*` | **commentés** |
| Jicofo `conference-muc-jid` | `conference.live.mcbuleli.org` |
| JWT `sub` | `live.mcbuleli.org` |
| JWT `room` | `test-live-mcbuleli` (identique host/guest) |
| JWT `context.user.lobby_bypass` | `true` (Render déployé) |

---

## Procédure VPS (une fois)

```bash
cd ~/McBuleliP2P && git pull
sudo bash ops/jitsi/fix-live-unified-baseline.sh
sudo bash ops/jitsi/audit-live-coherence.sh test-live-mcbuleli
```

Pendant test live (2 onglets) :

```bash
sudo tail -f /var/log/prosody/prosody.log
sudo journalctl -u jicofo -f
```

**Succès :** les deux lignes `Authenticated as …@live.mcbuleli.org` et joins sur  
`test-live-mcbuleli@conference.live.mcbuleli.org`, UI **2 participants**.

---

## Render (app)

Vérifier variables :

- `JITSI_APP_ID=mcbuleli_live`
- `JITSI_JWT_SUB=live.mcbuleli.org`
- `JITSI_JWT_SECRET` = même secret que `/root/.mcbuleli-jitsi-secret` sur le VPS

Redéployer après merge de `kid` + `lobby_bypass` dans `academy-jitsi-token.ts`.
