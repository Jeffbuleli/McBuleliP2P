# NGEMBA — GPS téléphone sur le dossier

État prod : **corrigé et vérifié le 26 nov. 2026** (`50c342f6` sur `main`, image `ngemba-web` sur `153.75.235.176`).

L’IA (OpenAI / NVIDIA) **ne reçoit pas** la latitude ni la longitude. Elle ne crée pas le point. Le GPS est le navigateur → API → `session.lat` / `session.lng`. L’équipe humaine le lit dans le dossier ops.

## Règle

| Source | Ce qu’on stocke | Carte ops |
|--------|-----------------|-----------|
| GPS téléphone (`accuracyM` ≤ 2500) | `lat`, `lng`, `locationAccuracyM`, source `…+gps_precise` ou `…+gps_wide` | Oui, avec ± m |
| Ville IP | libellé `≈ Ville (IP)` dans `routingMeta.ipGeo` seulement | Non |
| Lieu choisi à la main | centroïde du référentiel, source `place` | Non (pas un GPS victime) |

Ne jamais copier le centroïde IP dans `session.lat` / `session.lng`. Ne jamais afficher ce centroïde comme l’adresse de la personne.

## Chaîne

1. `precise-gps.ts` : `watchPosition` + `getCurrentPosition` (`enableHighAccuracy`, `maximumAge: 0`). Le navigateur parle `latitude` / `longitude` ; le reste du code parle `lat` / `lng` / `accuracyM`.
2. Création : `POST /api/alerts` avec `shareLocation`, `lat`, `lng`, `accuracyM`. Réponse : `id` + `sessionKey` (même valeur que le cookie `ngemba_citizen`).
3. Si le fix arrive après l’envoi (mode discret, page dossier) : `POST /api/alerts/{id}/location`.
4. Auth de ce POST : cookie **ou** en-tête `X-Ngemba-Citizen` (clé gardée en `sessionStorage` par `session-client.ts`). Sans l’un des deux → **403**, rien n’est écrit.
5. `updateSessionGps` refuse un point déjà moins précis. Un point très large qui recopie l’IP (± quelques mètres, précision > 1200 m) n’est pas enregistré.
6. Ops recharge le dossier toutes les 8 s et reçoit `alert_updated` quand le GPS est vraiment persisté.

Chemins qui envoient le GPS : SOS (`sos-flow.tsx`), discret (`fire-alert.ts`, geste / PWA), école (`school-flow.tsx`, `school-chat.tsx`), rattrapage page dossier (`session-view.tsx` → `push-session-gps.ts`).

## Pourquoi ça cassait (nov. 2026)

Les dossiers discrets partaient avec `lat`/`lng` null et `locationSource: discrete_extreme_ip+ipwho`, alors que le téléphone affichait « position autorisée ».

1. Android donne souvent d’abord un point réseau **> 1000 m**. L’app le jetait. Le dossier partait sans coordonnées.
2. Le rattrapage `POST …/location` exigeait le cookie. La page dossier s’ouvre sans ce cookie (lecture citoyenne ouverte). En PWA / webview le POST répondait 403, sans message.
3. L’ops montrait donc seulement la ville IP. Ce n’était pas un échec du modèle de langue.

Un dossier antérieur (`806c06a2`, ±100 m) prouvait que le stockage GPS fonctionnait quand le point passait les filtres.

## Ce que la victime doit voir

- Page dossier : « Envoi de votre position… » puis « Position GPS enregistrée sur ce dossier ».
- Refus OS : « GPS refusé — autorisez la localisation… ».
- Pas de GPS : le parcours SOS propose encore le lieu manuel. L’IP reste une ville, marquée `(IP)`.

## Vérifier

1. Téléphone, même navigateur que l’alerte. Rester sur `/session/{id}` jusqu’au texte « Position GPS enregistrée ».
2. Ops : ± mètres et lien carte. Pas de carte si seul le libellé IP est là.
3. Serveur, sans coordonnées en clair : `docker logs ngemba-web-1 2>&1 | grep '\[ngemba\] location'`
   - `location saved` + `accuracyM` = écrit.
   - `location forbidden` = cookie et en-tête absents.
   - `location not persisted` = point rejeté (déjà plus serré, ou copie IP trop large).

Logs navigateur (pas de lat/lng) : `gps browser` (`denied` | `timeout` | `unavailable`), `gps discrete backfill` (`saved` | `forbidden` | `too_wide`).

## Déployer

Le Compose n’est **pas** à la racine `/opt/ngemba`. Secrets : `/opt/ngemba/ops/vps/.env`. Volume dossiers : `ngemba_data` → `/app/data`.

```bash
# depuis le Mac, après commit des fichiers services/ngemba
rsync -az --exclude node_modules --exclude .next --exclude .env --exclude scripts/.cache \
  services/ngemba/ root@153.75.235.176:/opt/ngemba/
ssh root@153.75.235.176 'cd /opt/ngemba/ops/vps && docker compose build web && docker compose up -d web'
```

Ne pas lancer `docker compose` dans `/opt/ngemba` : il n’y a pas de fichier Compose, et un `rsync --delete` ne doit pas emporter `ops/vps/.env` (il est exclu du transfert et ne doit pas être la cible d’un delete).

Santé : `curl -sS http://127.0.0.1:3012/api/health` sur le VPS, ou `https://ngemba-rdc.org/api/health`.
