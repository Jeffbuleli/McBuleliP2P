# Academy — infra backlog (Jitsi, VOD R2, analytics)

Guide ops pour activer le backlog **hors phases produit** après P0–P4.

---

## 1. Migration base

```bash
npm run db:migrate:render
```

Inclut notamment `0062_academy_replay_r2` (`replay_r2_key` sur `academy_sessions`).

---

## 2. Jitsi self-host (recommandé prod)

### Objectif

Salles `mcbuleli-{edition}-{session}` sur **votre** domaine (pas `meet.jit.si` public), avec presets host / learner déjà dans `src/lib/academy-live.ts`.

### Étapes

1. **VM ou service** (ex. Hetzner 2 vCPU / 4 Go RAM) — installer [Jitsi Meet](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-quickstart) sur un sous-domaine, ex. `live.mcbuleli.org`.
2. **DNS** : enregistrement A `live.mcbuleli.org` → IP du serveur Jitsi.
3. **HTTPS** : certificat Let’s Encrypt (script Jitsi).
4. **Render — Web McBuleli** (variables d’environnement) :

```env
NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL=https://live.mcbuleli.org
NEXT_PUBLIC_ACADEMY_JITSI_BASE_URL=https://live.mcbuleli.org
# Optionnel — iframe dans la companion app
NEXT_PUBLIC_ACADEMY_LIVE_EMBED=true
```

5. **Édition cohorte** : en admin, champ `live_base_url` sur l’édition (seed juin) ou laisser l’env global.
6. **Test** : staff ouvre une session → badge **Animation** → lien host 480p ; apprenant → 360p / audio seul.
7. **Co-animateur** : `/admin/academy` → onglet **Lives & Jitsi** → ajouter l’email → lien host pour cette personne.
8. **Centre de contrôle** : `/admin/academy` — onglets Aperçu, Programme (`live_base_url`, statut, tuteur IA), Lives (liens host / apprenant / companion), Inscriptions, Analytics, Outils.

### Ordre de résolution URL live

`session.live_url` (admin) → `edition.live_base_url` → `NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL` → `NEXT_PUBLIC_ACADEMY_JITSI_BASE_URL` → `meet.jit.si` (fallback).

---

## 3. VOD replays (Cloudflare R2)

### Objectif

Replays hébergés sur R2 (CDN), clé objet par session, sans exposer de JSON technique aux apprenants.

### Étapes

1. **Cloudflare** → R2 → créer bucket `mcbuleli-academy` (ou nom choisi).
2. **Accès public lecture** (ou custom domain `media.mcbuleli.org` lié au bucket).
3. **Render — secrets** :

```env
ACADEMY_R2_PUBLIC_BASE_URL=https://media.mcbuleli.org
# Optionnel upload futur / scripts ops :
# ACADEMY_R2_ACCOUNT_ID=
# ACADEMY_R2_ACCESS_KEY_ID=
# ACADEMY_R2_SECRET_ACCESS_KEY=
# ACADEMY_R2_BUCKET=mcbuleli-academy
```

4. **Après chaque live** : exporter la vidéo (OBS / enregistrement Jitsi) → upload MP4 dans R2, ex.  
   `replays/juin-2026/samedi-15-juin.mp4`
5. **Admin** `/admin/academy` → édition → session → champ **`replay_r2_key`** = chemin objet (sans domaine).  
   Alternative : **`replay_url`** = lien HTTPS complet (YouTube, Drive public, etc.).
6. **Vérifier** : fin de session → bouton « Voir le replay » côté apprenant ; event `replay_viewed` dans analytics.

L’app construit l’URL : `{ACADEMY_R2_PUBLIC_BASE_URL}/{replay_r2_key}`.

---

## 4. Analytics formateur

### Dans l’app (déjà livré)

`/admin/academy` → sélectionner une édition → panneau **Analytics formateur** :

- Inscrits actifs
- Présences live (enrollments distincts)
- Quiz réussis
- Modules terminés
- Vues replay
- Répartition `academy_learning_events` par `verb`

API : `GET /api/admin/academy/analytics?edition={slug}` (super_admin).

### Usage pédagogique

- Avant le live : comparer inscrits vs présents J-1.
- Après : publier replay R2 si replay_views faible.
- Relancer par email journey (cron `mcbuleli-academy-journey-nudge`) si progression basse.

---

## 5. Checklist « ça marche très bien »

| # | Action |
|---|--------|
| 1 | `npm run db:migrate:render` sur prod |
| 2 | Crons Render actifs : `mcbuleli-academy-reminders`, `mcbuleli-academy-journey-nudge` |
| 3 | `RESEND_ALLOW_SEND=true` pour emails progression |
| 4 | Jitsi self-host + env `NEXT_PUBLIC_ACADEMY_*` |
| 5 | Replays : `replay_r2_key` ou `replay_url` après chaque session |
| 6 | Co-animateurs désignés si formateur externe (non agent) |
| 7 | Hard refresh PWA après déploiement |

---

Voir aussi : `docs/academy.md`, `docs/academy-open-classroom.md`.
