# Jitsi JWT — verrouiller `live.mcbuleli.org`

À faire **sur le VPS** après branding (`README.md`).

## 1. Générer un secret (Mac ou VPS)

```bash
openssl rand -hex 32
```

Render → **Environment** :

```env
JITSI_APP_ID=mcbuleli_live
JITSI_JWT_SECRET=<le secret>
JITSI_JWT_SUB=live.mcbuleli.org
```

## 2. Prosody (VPS)

```bash
apt install -y lua-inspect lua-basexx
```

Édite `/etc/prosody/conf.avail/live.mcbuleli.org.cfg.lua` — dans `VirtualHost "live.mcbuleli.org"` :

```lua
authentication = "token"
app_id = "mcbuleli_live"
app_secret = "MÊME_SECRET_QUE_RENDER"
allow_empty_token = false
```

Puis :

```bash
prosodyctl restart
systemctl restart jicofo jitsi-videobridge2
```

## 3. Jitsi Meet config

Dans `/etc/jitsi/meet/live.mcbuleli.org-config.js` :

```javascript
config.enableUserRolesBasedOnToken = true;
```

## 4. Test

1. Connecté sur mcbuleli.org → ouvrir un live Academy → le lien doit contenir `?jwt=…`
2. Ouvrir `https://live.mcbuleli.org/une-salle` **sans** jwt → refus / page vide

## 5. Rollback

`allow_empty_token = true` + retirer `JITSI_JWT_SECRET` sur Render (l’app repasse en URLs sans jwt).
