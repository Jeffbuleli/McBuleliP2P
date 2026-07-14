# Serveur principal McBuleli

| Rôle | Valeur |
|------|--------|
| **VPS principal** | `162.35.181.98` |
| **Ancien live only** | `162.35.160.30` (à décommissionner après cutover) |
| Domaines | `mcbuleli.org` + `www` + `live.mcbuleli.org` |

Tout (Next.js, Postgres, crons haute fréquence, ai-relay, **Jitsi Live**) tourne sur **162.35.181.98**.

## DNS (Cloudflare)

| Record | Type | Cible après cutover | Notes |
|--------|------|---------------------|--------|
| `mcbuleli.org` | A / CNAME | via Cloudflare → origin `162.35.181.98` | Aujourd’hui proxy CF (IPs `104.21` / `172.67`) — mettre l’**origin** A/AAAA (DNS only ou proxied) vers le nouveau VPS |
| `www` | CNAME/A | idem | |
| `live.mcbuleli.org` | **A** | `162.35.181.98` | Aujourd’hui = `162.35.160.30` — **à basculer en dernier** pour le live |

Vérif :

```bash
dig +short live.mcbuleli.org A   # → 162.35.181.98
dig +short mcbuleli.org A        # CF ou → 162.35.181.98
```

## Ordre de bascule

1. SSH root@162.35.181.98 (clé déployée) → `bash ops/vps/install.sh`
2. Dump Render → restore Postgres (app encore sur Render OK pendant ce temps)
3. Migrer **Jitsi** depuis 162.35.160.30 (voir `ops/vps/migrate-live-from-old.sh`)
4. Staging app : `http://162.35.181.98:3000` / hostname test
5. DNS `live` → nouveau IP (fenêtre courte ; garder ancien allumé 24–48 h)
6. Origin `mcbuleli.org` → nouveau IP ; suspendre Render web+DB après validation
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
