# Jitsi (`live.mcbuleli.org`) — sécurité McBuleli

Modèle : **SSO McBuleli via JWT** (pas de login User/Password Jitsi). Voir aussi [academy-live-access.md](./academy-live-access.md) et [ops/jitsi/jwt-setup.md](../ops/jitsi/jwt-setup.md).

## Architecture

```mermaid
flowchart LR
  U[Utilisateur McBuleli] --> A[mcbuleli.org login]
  A --> T[/api/academy/live/join-token]
  T --> J[live.mcbuleli.org?jwt=…]
  N[Nginx gate] -->|sans jwt| A
  P[Prosody token] --> J
```

| Couche | Rôle |
|--------|------|
| **Nginx gate** | Redirige vers `/login` ou `/app/live/enter` si pas de `?jwt=` |
| **Prosody** | `authentication = "token"`, `allow_empty_token = false` |
| **Render** | Signe le JWT (`JITSI_JWT_SECRET` = `app_secret` VPS) |
| **App** | Vérifie inscription / paiement host avant d’émettre le JWT |

## Variables Render

```env
NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL=https://live.mcbuleli.org
JITSI_APP_ID=mcbuleli_live
JITSI_JWT_SECRET=<identique Prosody app_secret>
JITSI_JWT_SUB=live.mcbuleli.org
JITSI_JWT_TTL_SEC=7200
```

- **TTL JWT** : 2 h par défaut (plus 12 h) — renouvellement via companion / re-join.
- **Turnstile** : non requis sur Jitsi (auth McBuleli en amont).

## Déploiement VPS (une fois + après upgrade Jitsi)

```bash
cd /path/to/McBuleliP2P   # ou deploy-live-vps.sh
sudo bash ops/jitsi/harden-security.sh
```

Le script enchaîne :

1. `fix-jitsi-jwt-only-mode.sh` — pas de domaine guest anonyme
2. `apply-nginx-live-gate.sh` — gate McBuleli
3. `config.js` — pas d’upload fichier, E2EE activé, durée max conférence (4 h)
4. Nginx — rate limit salles sans JWT, `/sounds/` protégé (referer)
5. Logs d’accès nginx dédiés

Options :

```bash
MCBULELI_JITSI_DISABLE_SCREENSHARE=false bash ops/jitsi/harden-security.sh
MCBULELI_JITSI_MAX_HOURS=3 bash ops/jitsi/harden-security.sh
```

## Audit côté app

Table `jitsi_access_log` (migration `0096_jitsi_access_log.sql`) :

- user, room, edition, mode (host/learner/audio), IP, user-agent, timestamp
- Remplie à chaque URL live signée (`resolveGatedLiveJoinUrl`)
- Rate limit : 30 req/min/user sur `/api/academy/live/join-token`

```bash
npm run db:migrate:render
```

## Tests post-déploiement

```bash
# Sans JWT → redirection login McBuleli
curl -sI https://live.mcbuleli.org/ma-salle | grep -i location

# Sons non référencés → 403
curl -sI https://live.mcbuleli.org/sounds/reactions-applause.mp3 | head -1

# Avec compte : companion Academy → 2 participants même MUC
sudo bash ops/jitsi/check-muc-live.sh <room-slug>
```

## Mises à jour & CVE

```bash
sudo apt update && sudo apt list --upgradable | grep -i jitsi
sudo apt upgrade jitsi-meet jitsi-meet-prosody jitsi-videobridge2 jicofo
sudo bash ops/jitsi/harden-security.sh
```

Ne **pas** réactiver `anonymousdomain` / `guest.*` (split MUC — voir `ops/jitsi/SPLIT-ROOM-ROOT-CAUSE.md`).

## OAuth Google

Non utilisé pour Jitsi McBuleli — l’équivalent OAuth est le **flux McBuleli** (session cookie → JWT Jitsi).
