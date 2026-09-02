# PHASE 0 — Audit VPS & démarrage NGEMBA

> Date : **2 septembre 2026** · Domaine temporaire : **`ngemba.cyberalert-rdc.org`**  
> Repo parent : McBuleliP2P · produit isolé prévu : `services/ngemba/`

---

## 1. Verdict hébergement

**Africa Insight et Cyber Alert sont sur le même VPS** — ce n’est pas deux machines.

| Critère | VPS CyberAlert / Africa Insight | VPS McBuleli |
|---------|----------------------------------|--------------|
| **IP** | `153.75.235.176` | `162.35.181.98` |
| **Hostname** | `vps3537083.trouble-free.net` | `mcbuleli243` |
| **Disque** | 38 Go · **6,2 Go libres (83 %)** | 156 Go · **23 Go libres (85 %)** |
| **RAM** | **1,6 GiB** · ~526 MiB dispo · **1,4 GiB swap utilisé | **7,3 GiB** · ~3,1 GiB dispo |
| **CPU** | 1 vCPU · load ~0,2 | 2 vCPU · load ~0,1 |
| **Apps live** | Cyber Alert + Africa Insight + **Patty** | McBuleli + e-avec + ISP (+ restes AI/Cyber) |

### Recommandation Phase 0 → Phase 1

| Décision | Choix | Pourquoi |
|----------|-------|----------|
| **Domaine** | `ngemba.cyberalert-rdc.org` | Même pattern que `patty.cyberalert-rdc.org` ; pas d’achat domaine propre pour l’instant |
| **Hôte cible** | **`153.75.235.176`** (CyberAlert) | Cohérence produit « protection / alerte » ; DNS déjà sous `cyberalert-rdc.org` |
| **Risque principal** | **RAM**, pas le disque | 1,6 GiB déjà partagé par 3 apps + 2 Postgres |
| **Mitigation MVP** | DB **partagée** `cyberalert-db` (nouvelle DB `ngemba`) · pas de 2ᵉ Postgres · build hors-box ou prune cache avant deploy | Évite +150–300 MiB RAM |
| **Avant 1er deploy** | `docker builder prune -af` sur ce VPS | **~16 Go reclaimable** dans le build cache (mesuré) → libère largement le disque |
| **Si RAM critique** | Upgrader à **≥ 4 GiB** ou déplacer Africa Insight / Patty | Documenté aussi dans `CyberAlert/ops/vps/VPS_ORGANIZATION.md` |

**McBuleli VPS** a plus de marge (RAM + disque) mais mélange fintech / live / AVEC — à éviter pour des données d’alerte sensibles tant qu’on peut rester chez CyberAlert.

---

## 2. Inventaire VPS `153.75.235.176` (mesuré)

### Conteneurs & mémoire

| Conteneur | RAM approx. | Port local |
|-----------|-------------|------------|
| `africa-insight-web-1` | ~151 MiB | `127.0.0.1:3002` |
| `cyberalert-web-1` | ~103 MiB | `127.0.0.1:3010` |
| `patty-web-1` | ~21 MiB | `127.0.0.1:3011` |
| `cyberalert-db-1` | ~14 MiB | `127.0.0.1:5433` |
| `patty-db-1` | ~8 MiB | `127.0.0.1:5434` |
| `cyberalert-ai-1` | ~2 MiB | `127.0.0.1:8090` |

### Nginx / domaines déjà servis

- `cyberalert-rdc.org` / `www`
- `africa-insight.org` / `www`
- `patty.cyberalert-rdc.org`

### `/opt` (taille)

| Chemin | Taille |
|--------|--------|
| `/opt/cyberalert` | 582 Mo |
| `/opt/patty` | 507 Mo |
| `/opt/africa-insight` | 266 Mo |

### Docker disk (important)

```
Build Cache  ~18 Go  dont ~16 Go reclaimable
Images       ~1,7 Go
Volumes      ~161 Mo
```

→ **Ne pas bloquer NGEMBA sur le disque** sans avoir d’abord nettoyé le cache de build (commande manuelle, hors Phase 0 code).

---

## 3. Domaine & DNS (à faire)

| Record | Type | Cible | Notes |
|--------|------|-------|-------|
| `ngemba.cyberalert-rdc.org` | **A** | `153.75.235.176` | Proxied Cloudflare (comme `patty`) |
| — | — | — | Certbot après vhost nginx : `-d ngemba.cyberalert-rdc.org` |

App bind proposé : **`127.0.0.1:3012`** (3002 Africa · 3010 Cyber · 3011 Patty · **3012 Ngemba**).

---

## 4. Phase 0 — checklist

| # | Livrable | Statut |
|---|----------|--------|
| 0.1 | Audit VPS (ce document) | ✅ |
| 0.2 | Domaine figé : `ngemba.cyberalert-rdc.org` | ✅ décision |
| 0.3 | Scaffold `services/ngemba/` + tokens + health | ✅ |
| 0.4 | Schéma DB v0 (Drizzle draft) | ✅ |
| 0.5 | Ops : nginx stub + compose notes | ✅ stub nginx + HOST.md |
| 0.6 | Note juridique / responsabilité (brouillon) | ✅ brouillon |
| 0.7 | Protocole opérateur ONG (brouillon) | ✅ brouillon |
| 0.8 | Home SVG + i18n 6 langues + plan OpenAI combiné | ✅ |
| 0.8b | Spec écrans E0-E5 (lien Figma) | ⏳ design |
| 0.9 | DNS Cloudflare + TLS (quand app prête) | ✅ https://ngemba.cyberalert-rdc.org |
| 0.10 | ONG pilote signée | ⏳ hors tech |
| 0.11 | Prune Docker build cache VPS (~16 Go) | ⏳ manuel |
| 0.12 | Upgrade RAM VPS ≥ 4 GiB (recommandé avant charge) | ⏳ optionnel |

**Critère de sortie Phase 0 :** scaffold local qui build · schéma v0 · docs ops/DNS · brouillon juridique + protocole · go design E0–E5.

---

## 5. Architecture cible (légère)

```
Internet → Cloudflare
              ↓
   VPS 153.75.235.176 (nginx TLS)
              ↓
   ngemba.cyberalert-rdc.org → 127.0.0.1:3012 (ngemba-web)
              ↓
   Postgres cyberalert-db (:5433) → database `ngemba`  (même instance, DB séparée)
   R2 media.cyberalert-rdc.org   → préfixe `ngemba/` (ou bucket dédié plus tard)
```

Isolation logique : **DB + secrets + code** séparés de Cyber Alert / Patty / Africa Insight.  
Isolation physique : **même VPS** pour Phase 0–1 ; revoir si volume d’alertes ou conformité l’exige.

---

## 6. Actions ops recommandées (manuel, avant 1er deploy)

```bash
# Sur 153.75.235.176 — libérer ~16 Go (safe : cache build seulement)
docker builder prune -af
df -h /

# Créer la DB (une fois Postgres cyberalert up)
docker compose -f /opt/cyberalert/ops/vps/docker-compose.yml exec -T db \
  psql -U cyberalert -c "CREATE DATABASE ngemba;"
```

*(Noms user/DB exacts à vérifier dans `/opt/cyberalert/ops/vps/.env`.)*

---

## 7. Références

- Plan maître : [PLAN-MAITRE.md](./PLAN-MAITRE.md)
- Tokens UI : [01-DESIGN-TOKENS.md](./01-DESIGN-TOKENS.md)
- Schéma : [02-SCHEMA-DB-DRAFT.md](./02-SCHEMA-DB-DRAFT.md)
- CyberAlert VPS : `/Users/mac/Documents/CyberAlert/ops/vps/SERVER.md`
- Africa Insight host : `/Users/mac/Documents/Afrika/ops/vps/HOST.md`

*Document v1.0 — Phase 0 NGEMBA*
