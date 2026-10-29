# Serveurs McBuleli — prod vs migration

**Prod `mcbuleli.com` aujourd’hui :** lire d’abord **[docs/vps-production-host.md](../../docs/vps-production-host.md)** (origin **153.75.235.176**).

Ce fichier décrit surtout la **cible** migration « VPS principal » et le live Jitsi.

| Rôle | IP | Notes |
|------|-----|--------|
| **Prod web + Postgres (Cloudflare origin)** | **`153.75.235.176`** | SSH OK · Docker `mcbuleli-web` · Nginx `mcbuleli.com` |
| **Cible migration tout-en-un** | `162.35.181.98` | InterServer · doc historique · **pas** l’origin McBuleli.com actuel |
| **Ancien live only** | `162.35.160.30` | À décommissionner après cutover live |
| Domaines | **`mcbuleli.com`** + `www` · legacy `mcbuleli.org` · `live.mcbuleli.org` · **`e-avec.org`** |

## DNS (Cloudflare)

| Record | Type | Origin prod (mesuré) | Cible migration |
|--------|------|----------------------|-----------------|
| `mcbuleli.com` / `www` | proxied CF | **`153.75.235.176`** | `162.35.181.98` (prévu) |
| `mcbuleli.org` / `www` | proxied CF | idem | idem |
| `e-avec.org` / `www` | — | (selon déploiement AVEC) | même origin cible 162.35 |
| `live.mcbuleli.org` | **A** | souvent `162.35.160.30` | `162.35.181.98` |

Vérif origin (sans deviner le DNS public) :

```bash
curl -sk -o /dev/null -w "153.75 → %{http_code}\n" -H "Host: mcbuleli.com" https://153.75.235.176/login
curl -sk -o /dev/null -w "162.35 → %{http_code}\n" -H "Host: mcbuleli.com" https://162.35.181.98/login
```

## GitHub Actions Deploy VPS

Secrets (**Settings → Actions → Secrets**) :

| Secret | Valeur |
|--------|--------|
| `VPS_HOST` | **`153.75.235.176`** (prod McBuleli tant que CF origin = cette IP) |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | clé privée autorisée sur **153.75** (`authorized_keys`) |

Si le workflow échoue avec `unable to authenticate`, régénérer une paire deploy, ajouter la `.pub` sur le VPS, mettre à jour `VPS_SSH_KEY`.

## Ordre de bascule (vers 162.35.181.98)

1. SSH root@162.35.181.98 (clé déployée) → `bash ops/vps/install.sh`
2. Dump Render → restore Postgres (app encore sur Render OK pendant ce temps)
3. Migrer **Jitsi** depuis 162.35.160.30 (voir `ops/vps/migrate-live-from-old.sh`)
4. Staging app : `http://162.35.181.98:3000` / hostname test
5. DNS `live` → nouveau IP (fenêtre courte ; garder ancien allumé 24-48 h)
6. Origin Cloudflare `mcbuleli.com` → **162.35.181.98** ; mettre à jour `VPS_HOST` GHA
7. Désactiver crons Render ; activer crontab + GHA

Détail app/cron : [docs/vps-migration.md](../../docs/vps-migration.md)

## Ports à ouvrir (firewall)

| Port | Service |
|------|---------|
| 22 | SSH |
| 80 / 443 | Nginx (app + live) |
| 10000/udp | Jitsi JVB (médias) |
| 3478/udp | TURN (si coturn) |

Ne **pas** exposer Postgres `5432` publiquement (docker bind `127.0.0.1` seulement).

## Remix IDE (ops, optionnel)

Deploy McB / contrats Solidity en interne :

| Élément | Valeur |
|---------|--------|
| Compose | `ops/vps/remix/docker-compose.yml` → `127.0.0.1:8080` |
| Install | `sudo bash ops/vps/install-remix.sh` |
| URL | `https://remix.mcbuleli.org` (Basic Auth + TLS) |
| Doc | [docs/mcb-remix-vps.md](../../docs/mcb-remix-vps.md) |

MetaMask se connecte **dans le navigateur** (Injected Provider), pas au serveur. Tunnel SSH exemple : `ssh -L 8080:127.0.0.1:8080 root@153.75.235.176` (prod) ou `162.35.181.98` (post-migration).
