# Variables Render — Live McBuleli Meet

**Pas de migration DB** pour le live : le branding Jitsi est sur le **VPS** (`live.mcbuleli.org`).

## Render Dashboard → Environment

```env
NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL=https://live.mcbuleli.org
JITSI_APP_ID=mcbuleli_live
JITSI_JWT_SECRET=<identique au secret Prosody sur le VPS>
JITSI_JWT_SUB=live.mcbuleli.org
```

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
