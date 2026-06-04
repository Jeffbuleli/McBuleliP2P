# Jitsi JWT — verrouiller `live.mcbuleli.org`

## ⚠️ Erreur fréquente

Si le terminal affiche :

```text
authentication: command not found
app_id: command not found
```

→ vous avez **collé du Lua dans bash**. Ces lignes vont **dans un fichier** Prosody, pas dans le terminal.

---

## 1. Secret + Render

Sur le VPS ou votre Mac :

```bash
openssl rand -hex 32
```

Render → **Environment** :

```env
JITSI_APP_ID=mcbuleli_live
JITSI_JWT_SECRET=<le secret généré>
JITSI_JWT_SUB=live.mcbuleli.org
```

---

## 2. Prosody (VPS) — méthode recommandée

### Option A — paquet officiel (le plus simple)

```bash
sudo apt update
sudo apt install -y jitsi-meet-tokens
```

L’installateur **demande** `Application ID` et `Application Secret` :

- ID : `mcbuleli_live` (identique à `JITSI_APP_ID` sur Render)
- Secret : **exactement** la même valeur que `JITSI_JWT_SECRET`

Le paquet écrit tout seul dans Prosody. Ensuite :

```bash
sudo systemctl restart prosody
sudo systemctl restart jicofo jitsi-videobridge2
```

### Option B — édition manuelle (nano)

1. Trouver le fichier :

```bash
sudo ls /etc/prosody/conf.avail/
sudo ls /etc/prosody/conf.d/ 2>/dev/null
```

Fichier **actif** sur votre VPS (voir `prosodyctl check config`) :

`/etc/prosody/conf.d/live.mcbuleli.org.cfg.lua`

(Parfois une copie existe aussi dans `conf.avail/` — éditez **conf.d**, c’est celui qui est chargé.)

2. Ouvrir avec un éditeur (**pas** coller les lignes dans le shell) :

```bash
sudo nano /etc/prosody/conf.d/live.mcbuleli.org.cfg.lua
```

3. Repérer le bloc existant :

```lua
VirtualHost "live.mcbuleli.org"
```

4. **À l’intérieur** de ce bloc (entre les lignes du VirtualHost), remplacer ou ajouter :

```lua
    authentication = "token"
    app_id = "mcbuleli_live"
    app_secret = "COLLEZ_ICI_LE_MÊME_SECRET_QUE_RENDER"
    allow_empty_token = false
```

Exemple (structure réelle, indentation avec 4 espaces) :

```lua
VirtualHost "live.mcbuleli.org"
    authentication = "token"
    app_id = "mcbuleli_live"
    app_secret = "abc123..."
    allow_empty_token = false
    ssl = {
        key = "/var/lib/prosody/live.mcbuleli.org.key";
        certificate = "/var/lib/prosody/live.mcbuleli.org.crt";
    }
    -- ... autres lignes déjà présentes ...
```

5. Vérifier que le MUC a `token_verification` (souvent déjà là après `jitsi-meet-tokens`) :

```lua
Component "conference.live.mcbuleli.org" "muc"
    modules_enabled = {
        "token_verification";
        -- ...
    }
```

6. Sauvegarder nano : `Ctrl+O` Entrée, quitter : `Ctrl+X`

7. Redémarrer :

```bash
sudo prosodyctl check config
sudo systemctl restart prosody
sudo systemctl restart jicofo jitsi-videobridge2
```

`check config` peut afficher « Problems found » avec des **avertissements** (`cross_domain_bosh`, `mod_posix`, « missing features ») — ce n’est **pas** bloquant si la ligne finale est `Done.` (nettoyage optionnel plus tard).

Sur Ubuntu récent, **ne pas** utiliser `prosodyctl restart` : utiliser `systemctl restart prosody`.

Vérifier le JWT :

```bash
sudo grep -E 'authentication|app_id|app_secret|allow_empty_token' \
  /etc/prosody/conf.d/live.mcbuleli.org.cfg.lua
```

---

## 3. Jitsi Meet (`config.js`)

```bash
sudo nano /etc/jitsi/meet/live.mcbuleli.org-config.js
```

À la fin du `config = { ... }` :

```javascript
config.enableUserRolesBasedOnToken = true;
```

Puis :

```bash
sudo systemctl restart nginx
```

---

## 4. Nginx — éviter le popup « User / Password »

Si les utilisateurs ouvrent `live.mcbuleli.org/salle` **sans** `?jwt=`, Jitsi affiche un login XMPP.

Ajoutez le snippet `ops/jitsi/nginx-live-mcbuleli-gate.conf` dans le vhost nginx, puis :

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Sans jwt → redirection vers `https://mcbuleli.org/app/live/enter?room=…` (login McBuleli, puis retour avec jwt).

---

## 5. Test

1. Live Academy sur mcbuleli.org → URL avec `?jwt=...`
2. `https://live.mcbuleli.org/test-sans-jwt` sans paramètre → **refus** (normal)

---

## 6. Doublons `authentication` (grep montre plusieurs lignes)

Exemple problématique : deux blocs `token` + `internal_hashed` dans le **même** `VirtualHost "live.mcbuleli.org"`.

1. Sauvegarde :

```bash
sudo cp /etc/prosody/conf.d/live.mcbuleli.org.cfg.lua \
  /root/live.mcbuleli.org.cfg.lua.bak
```

2. Voir le contexte (quel VirtualHost) :

```bash
sudo grep -n 'VirtualHost\|authentication\|app_id\|app_secret' \
  /etc/prosody/conf.d/live.mcbuleli.org.cfg.lua
```

3. Dans **un seul** `VirtualHost "live.mcbuleli.org"` garder **une** fois :

```lua
    authentication = "token"
    app_id = "mcbuleli_live"
    app_secret = "VOTRE_SECRET"
    allow_empty_token = false
```

Supprimer les doublons (`authentication = "token"` en double, lignes `-- do not delete me`, second `app_id`/`app_secret`).

4. `authentication = "internal_hashed"` est **normal** sur d’**autres** hôtes (ex. `guest.live.mcbuleli.org`, `auth.…`) — ne pas les supprimer.

5. `sudo prosodyctl check config && sudo systemctl restart prosody`

---

## 7. Rollback

Dans le VirtualHost, remettre par ex. `authentication = "internal_hashed"` (valeur d’origine — voir votre `.bak`) ou `allow_empty_token = true` si vous gardez `token`.
