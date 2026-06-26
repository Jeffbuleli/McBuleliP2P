# Variables Render — Live McBuleli Meet

**Pas de migration DB** pour le live : le branding Jitsi est sur le **VPS** (`live.mcbuleli.org`).

## Pourquoi « Jitsi Meet » ou fond noir en prod ?

| Niveau | Où | Ce qui change |
|--------|-----|----------------|
| **1. Render** | `mcbuleli.org` | URLs avec `?jwt=` + `#config.subject=…\| McBuleli` — **redéployer** après chaque push `main` |
| **2. VPS** | `live.mcbuleli.org` | Logo watermark, titre HTML, `config.js` — **`bash ops/jitsi/apply-mcbuleli-brand.sh`** après `git pull` |
| **3. Cache** | Navigateur mobile | Ancien onglet / PWA — **fermer l’onglet**, rouvrir depuis Academy |

Si l’en-tête affiche encore `lancement-8-juin | Jitsi Meet` → le **VPS** n’a pas la dernière version du script titre, ou vous n’utilisez pas un lien **depuis l’app** (sans hash `#config…`).

Vidéo pré-live **noire** = caméra éteinte ou permission refusée (normal comme meet.jit.si). Activez la caméra dans la barre du bas.

## Live de test

Après deploy Render, une session **`test-live-mcbuleli`** est créée/mise à jour automatiquement (toujours « en direct ») :

`/app/academy/juin-2026/live/test-live-mcbuleli?program=launch-crypto-trading-ia-p2p`

## Render Dashboard → Environment

```env
NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL=https://live.mcbuleli.org
JITSI_APP_ID=mcbuleli_live
JITSI_JWT_SECRET=<identique au secret Prosody sur le VPS>
JITSI_JWT_SUB=live.mcbuleli.org
JITSI_JWT_TTL_SEC=7200
```

Voir [jitsi-security.md](./jitsi-security.md) et `sudo bash ops/jitsi/harden-security.sh` sur le VPS.

Optionnel :

```env
NEXT_PUBLIC_ACADEMY_LIVE_EMBED=false
```

(`true` provoque un fond noir en iframe — garder `false`.)

Après modification : **Manual Deploy** ou attendre le redeploy auto sur `main`.

## VPS (obligatoire pour titre + logo dans la salle)

```bash
curl -fsSL "https://raw.githubusercontent.com/Jeffbuleli/McBuleliP2P/main/ops/jitsi/deploy-live-vps.sh" -o /root/deploy-live-vps.sh
bash /root/deploy-live-vps.sh
```

## Test

1. Connecté sur mcbuleli.org
2. Academy → live 8 juin → **Rejoindre le live**
3. Onglet : **Lancement | McBuleli Meet** — pas « Jitsi Meet »
