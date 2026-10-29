# Où tourne McBuleli en prod (lire en premier)

**Ne pas confondre** la doc de migration (`162.35.181.98`) avec l’**origin Cloudflare actuelle**.

## Source de vérité (oct. 2026)

| Rôle | IP | SSH clé Mac `id_ed25519` | `mcbuleli.com` |
|------|-----|--------------------------|----------------|
| **Prod McBuleli web + Postgres** | **`153.75.235.176`** | **Oui** | **Origin Cloudflare** → Nginx `mcbuleli.org` → Docker `:3000` |
| Hôte partagé (même machine) | idem | Oui | Africa Insight `:3002`, CyberAlert, Ngemba, Patty… |
| **Cible migration « tout-en-un »** | `162.35.181.98` (InterServer) | Non (clé non déployée) | **Pas** l’origin McBuleli.com aujourd’hui |
| Ancien live Jitsi | `162.35.160.30` | — | `live.mcbuleli.org` (cutover prévu vers 162.35) |

## Vérifier sans deviner

```bash
# Origin réel (bypass Cloudflare) — doit renvoyer 200 sur /login
curl -sk -o /dev/null -w "%{http_code}\n" -H "Host: mcbuleli.com" https://153.75.235.176/login
curl -sk -o /dev/null -w "%{http_code}\n" -H "Host: mcbuleli.com" https://162.35.181.98/login

# DNS public = Cloudflare seulement (pas l’IP du VPS)
dig +short A mcbuleli.com
```

## Deploy prod McBuleli

```bash
ssh root@153.75.235.176
bash /opt/mcbuleli/ops/vps/deploy.sh
bash /opt/mcbuleli/ops/vps/seed-nov26-formation.sh   # si édition nov26
```

- Dépôt git complet : **`/opt/mcbuleli`** (pas seulement `ops/vps/`).
- Secrets : **`/opt/mcbuleli/ops/vps/.env`** (jamais dans git).
- Compose : `docker-compose.yml` + **`docker-compose.shared-host.yml`** (RAM 1.6 GiB ; build Docker skip `tsc` via `NEXT_BUILD_SKIP_TYPECHECK=1` — OOM sinon).
- GitHub Actions **`VPS_HOST`** = **`153.75.235.176`** tant que Cloudflare pointe là.

Première install sans git : `bash ops/vps/bootstrap-git-on-shared-host.sh`.

## Hôte partagé — ne pas couper Africa Insight

**153.75** sert **McBuleli** et **Africa Insight** (`africa-insight-web-1`, port **3002**) en parallèle.  
**Interdit** : `docker stop africa-insight-web-1` pour « libérer la RAM » pendant un build McBuleli — le site Africa Insight a du trafic continu.  
Si le build McBuleli OOM : augmenter swap, build sur GHA/registry, ou `NEXT_BUILD_SKIP_TYPECHECK=1` (déjà sur shared-host) — pas arrêter l’autre produit.

## Piège fréquent (agents)

- Lire `ops/vps/SERVER.md` **sans** ce fichier → risque de deploy sur **162.35** (mauvais serveur).
- **`153.75`** = Cyber Alert VPS **et** McBuleli prod ; ce n’est pas « uniquement Africa Insight ».

Voir aussi : [docs/team-workflow.md](team-workflow.md), [ops/vps/SERVER.md](../ops/vps/SERVER.md) (cible migration).
