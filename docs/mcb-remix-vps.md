# Remix IDE privé sur VPS McBuleli + MetaMask

> **Statut :** ops Voie A — optionnel (alternative à remix.ethereum.org)  
> **Dernière révision :** août 2026  
> **Liens :** [mcb-voie-a-runbook.md](./mcb-voie-a-runbook.md) · [mcb-bsc-deploy-checklist.md](./mcb-bsc-deploy-checklist.md) · [ops/vps/SERVER.md](../ops/vps/SERVER.md)

---

## 1. Ce que MetaMask connecte (important)

| Mythe | Réalité |
|-------|---------|
| « Remix sur le VPS se connecte à MetaMask côté serveur » | **Non.** MetaMask est une **extension navigateur** sur **votre machine** (laptop / téléphone). |
| « Le VPS signe les transactions » | **Non.** Seul MetaMask signe. Le VPS héberge seulement l’**UI Remix**. |

```
┌──────────────────────┐         ┌─────────────────────────────┐
│  Votre navigateur    │ HTTPS   │  VPS 162.35.181.98           │
│  + MetaMask          │◄───────►│  remix.mcbuleli.org          │
│                      │         │  Nginx (auth) → :8080 Remix │
│  Injected Provider   │         │                             │
│  signe tx BSC        │──tx───► │  (pas de clé privée ici)    │
└──────────────────────┘         └─────────────────────────────┘
         │
         ▼
   BNB Smart Chain (chainId 56)
```

**Connexion Remix ↔ MetaMask** = dans Remix, **Environment → Injected Provider - MetaMask**.  
MetaMask doit être sur **BNB Smart Chain** (ou testnet) au moment du Deploy.

---

## 2. Pourquoi un Remix sur VPS ?

| Avantage | Inconvénient |
|----------|--------------|
| Workspace / URL interne équipe | Setup DNS + TLS + auth |
| Moins de dépendance à remix.ethereum.org | MetaMask exige **HTTPS** |
| Contrat `McBuleliToken.sol` collable en interne | Surcoût ops |

**Pour un seul deploy McB :** `https://remix.ethereum.org` reste le plus rapide.  
**Pour un atelier ops récurrent :** Remix VPS a du sens.

### Alternative sans exposer Remix

Tunnel SSH (recommandé si 1 personne) :

```bash
ssh -L 8080:127.0.0.1:8080 root@162.35.181.98
# puis ouvrir http://localhost:8080  (MetaMask accepte localhost)
```

Dans ce cas : Docker Remix suffit, **pas besoin** de `remix.mcbuleli.org`.

---

## 3. Installation interne (VPS)

Fichiers repo :

| Fichier | Rôle |
|---------|------|
| `ops/vps/remix/docker-compose.yml` | Image `remixproject/remix-ide:remix_live` sur `127.0.0.1:8080` |
| `ops/vps/nginx-remix.conf` | HTTPS + Basic Auth → Remix |
| `ops/vps/install-remix.sh` | Bootstrap Docker + htpasswd + nginx |

### 3.1 Sur le VPS

```bash
# Sur le VPS (repo standard = /opt/mcbuleli)
ls /opt/mcbuleli/.git || git clone https://github.com/Jeffbuleli/McBuleliP2P.git /opt/mcbuleli
cd /opt/mcbuleli
git pull --ff-only
bash ops/vps/install-remix.sh
```

Si `ops/vps/install-remix.sh` est absent après `git pull`, le commit Remix n’est pas encore sur GitHub — poussez depuis le Mac, ou démarrez Remix à la main (voir §3.5).

Le script :

1. `docker compose up -d` dans `ops/vps/remix`
2. Crée `/etc/nginx/.htpasswd-remix` (user + mot de passe)
3. Installe le site Nginx `remix.mcbuleli.org`
4. Recharge Nginx

### 3.2 DNS Cloudflare

| Record | Type | Cible |
|--------|------|-------|
| `remix.mcbuleli.org` | A | `162.35.181.98` |

Proxy CF : **DNS only** (gris) ou proxied — les deux OK si TLS origin correct.

### 3.3 TLS

```bash
# Cert dédié
certbot certonly --nginx -d remix.mcbuleli.org

# Puis dans nginx-remix.conf, pointer :
# ssl_certificate     /etc/letsencrypt/live/remix.mcbuleli.org/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/remix.mcbuleli.org/privkey.pem;
nginx -t && systemctl reload nginx
```

Ou ajouter `remix.mcbuleli.org` au SAN du certificat `mcbuleli.org` existant.

### 3.4 Firewall

Aucun port **8080** public. Seulement **443** (Nginx). Remix écoute en `127.0.0.1:8080`.

### 3.5 Démarrage manuel (sans script, si fichiers absents du remote)

```bash
mkdir -p /opt/mcbuleli-remix && cd /opt/mcbuleli-remix
cat > docker-compose.yml <<'EOF'
name: mcbuleli-remix
services:
  remix:
    image: remixproject/remix-ide:remix_live
    container_name: mcbuleli-remix
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"
EOF
docker compose pull
docker compose up -d
curl -I http://127.0.0.1:8080/
```

Puis depuis votre Mac (MetaMask sur localhost) :

```bash
ssh -L 8080:127.0.0.1:8080 root@162.35.181.98
# ouvrir http://localhost:8080
```

---

## 4. Paramétrage Remix pour McB (après login auth)

1. Ouvrir `https://remix.mcbuleli.org` (Basic Auth ops).
2. File Explorer → New File `McBuleliToken.sol` → coller le contenu de `contracts/McBuleliToken.sol`.
3. **Solidity Compiler** → version **0.8.20** → Compile.
4. **Deploy & Run** :
   - Environment : **Injected Provider - MetaMask**
   - MetaMask : réseau **BNB Smart Chain** (56), compte deployer avec BNB
   - Contract : `McBuleliToken`
   - **VALUE = 0**
   - `initialSupply` = `100000000000000000000000000`
5. Deploy → confirmer dans MetaMask.
6. Copier l’adresse sous **Deployed Contracts** → `MCB_TOKEN_CONTRACT`.

Checklist détaillée : [mcb-bsc-deploy-checklist.md](./mcb-bsc-deploy-checklist.md).

---

## 5. Sécurité (obligatoire)

| Règle | Pourquoi |
|-------|----------|
| Basic Auth (ou VPN / IP allowlist) | Remix public = surface d’attaque |
| Bind Docker `127.0.0.1:8080` | Pas d’accès direct au container |
| HTTPS | MetaMask / navigateurs bloquent souvent Injected Provider en HTTP clair |
| **Jamais** de clé privée MetaMask sur le VPS | Le VPS n’est que l’UI |
| Ne pas committer `.htpasswd` | Mot de passe ops hors git |

Option durcie : restreindre Nginx à votre IP bureau / Cloudflare Access.

---

## 6. Vérifications

```bash
# Sur VPS
docker ps | grep mcbuleli-remix
curl -I http://127.0.0.1:8080/

# Depuis votre machine (après DNS+TLS+auth)
curl -I -u ops:VOTRE_MDP https://remix.mcbuleli.org/
```

Dans Remix : si Injected Provider ne voit pas MetaMask →

1. Extension MetaMask installée et déverrouillée
2. URL en **https://** (ou localhost via tunnel SSH)
3. Rafraîchir la page Remix
4. MetaMask → Connected sites → autoriser `remix.mcbuleli.org`

---

## 7. Désinstallation

```bash
cd ops/vps/remix && docker compose down
rm -f /etc/nginx/sites-enabled/remix.mcbuleli.org
nginx -t && systemctl reload nginx
```

---

## 8. Recommandation Voie A

| Situation | Choix |
|-----------|-------|
| Deploy McB **aujourd’hui** | `remix.ethereum.org` + MetaMask (15 min) |
| Équipe ops veut URL interne durable | Ce guide (Docker + `remix.mcbuleli.org`) |
| Une seule personne, max sécurité | Docker Remix + **tunnel SSH** `:8080` |

Après deploy : noter l’adresse contrat dans [mcb-voie-a-runbook.md](./mcb-voie-a-runbook.md) §A1, puis `npm run verify:mcb`.
