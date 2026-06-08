# McBuleli Community Hub — Plan Maître

> Architecte : module **Communauté** mobile-first, modulaire, sans régression sur Wallet / P2P / Trade / KYC / Jitsi / Notifications.

---

## 1. Audit architecture actuelle

### Stack

| Couche | Technologie | Fichiers clés |
|--------|-------------|---------------|
| Frontend | Next.js 16 App Router, React 19, Tailwind v4 | `src/app/`, `src/components/` |
| Backend | Route handlers API (~251 routes) | `src/app/api/**/route.ts` |
| ORM | Drizzle + `postgres` | `src/db/schema.ts`, `drizzle/*.sql` |
| Auth | JWT cookie `mcbuleli_session`, `jose` | `src/lib/jwt.ts`, `src/lib/session.ts` |
| Rôles | `user` / `agent` / `super_admin` + `staffScopes` | `src/lib/roles.ts` |
| KYC | Didit, gates par feature | `src/lib/kyc-policy.ts` |
| Notifications | `user_notifications` + kinds typés | `src/lib/notifications-service.ts` |
| Live | Jitsi self-hosted `live.mcbuleli.org` | `src/lib/academy-live-join.ts`, `ops/jitsi/` |
| PWA | manifest + SW minimal | `src/app/manifest.ts`, `public/sw.js` |
| Médias | Avatars/proofs en data-URL DB ; replays R2 URL only | `src/lib/academy-replay-url.ts` |

### Navigation actuelle (5 onglets)

`src/components/mobile/app-bottom-nav.tsx` : Home → Wallet → P2P → Trade → Profile.

### Points d'intégration naturels

- **Users** : table `users` existante — pas de compte parallèle.
- **Academy** : tables `academy_*` + routes `/app/academy` — Formations = façade communauté sur l'existant.
- **Notifications** : étendre `NotificationKind` (pas de nouveau canal).
- **Design** : tokens `--fd-primary`, `.fd-card`, `.fd-nav-glow` dans `globals.css`.

### Lacunes identifiées

- Pas d'upload R2 générique (seulement URLs replay academy).
- Pas de rate limiting global API.
- Service Worker sans cache offline.
- Pas de mode Data Saver.

---

## 2. Analyse impacts techniques

| Zone | Impact | Risque | Mitigation |
|------|--------|--------|------------|
| `schema.ts` | +11 tables community | Migration prod | Migration additive `0065_*`, pas de DROP |
| Bottom nav | 6e onglet | UI serrée mobile | Labels courts, icônes 22px, scroll horizontal si besoin |
| Notifications | +8 kinds | Type union TS | Extension progressive + drawer mapping |
| Bundle JS | Nouveau chunk `/app/community` | Perf 3G | `dynamic()` + code splitting par sous-module |
| Academy/Jitsi | Lecture seule + liens | Aucun changement ops Jitsi | Formations = proxy vers `/app/academy` |
| Wallet/P2P/Trade | Aucun | **Zéro** | Pas de FK cross-module obligatoire |
| Render Postgres | +indexes, croissance médias meta | Taille DB | Médias hors Postgres (R2/Stream) |
| Staff admin | Modération future | Scope agent | `community_moderation` dans `staffScopes` (Phase 1b) |

**Principe** : le module vit sous `src/lib/community/*` et `src/app/app/community/*`. Aucune modification des routes wallet/p2p/trade existantes.

---

## 3. Architecture cible

```
┌─────────────────────────────────────────────────────────────┐
│                    McBuleli PWA (mcbuleli.org)              │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │ Wallet  │ │  P2P    │ │  Trade   │ │   Community     │ │
│  │ (inchangé)         │ │ (inchangé)│ │  NOUVEAU        │ │
│  └─────────┘ └─────────┘ └──────────┘ └────────┬────────┘ │
└────────────────────────────────────────────────│──────────┘
                                                 │
         ┌───────────────────────────────────────┼───────────────────┐
         │                                       ▼                   │
         │  /api/community/*  ──►  community-*-service.ts            │
         │         │                                                 │
         │         ▼                                                 │
         │  Render PostgreSQL (métadonnées uniquement)               │
         │         │                                                 │
         │         ├─► user_notifications (kinds community_*)        │
         │         └─► academy_* (formations — lecture)              │
         │                                                           │
         │  Cloudflare R2  ◄── images (avatars, posts, blogs)        │
         │  Cloudflare Stream (opt.) ◄── vidéos feed                 │
         │                                                           │
         │  VPS live.mcbuleli.org ◄── Jitsi (inchangé, JWT app)      │
         └───────────────────────────────────────────────────────────┘
```

### Modules communauté

| Module | Route | Phase |
|--------|-------|-------|
| Hub | `/app/community` | 1 |
| Fil d'actualité | `/app/community/feed` | 1b |
| Blogs | `/app/community/blogs` | 2 |
| Formations | `/app/community/formations` → academy | 1 (lien) |
| Q&R | `/app/community/questions` | 2 |
| Profil public | `/app/community/u/[handle]` | 2 |

---

## 4. Schéma base de données

Migration : `drizzle/0065_community_hub_foundation.sql`  
Définition Drizzle : fin de `src/db/schema.ts`.

### Tables

```
community_user_profiles     — profil public (1:1 users)
community_media             — métadonnées fichiers R2/Stream
community_posts             — fil d'actualité
community_comments          — commentaires (posts, optionnel blogs)
community_likes             — likes polymorphes
community_blog_categories   — catégories blog
community_blog_posts        — articles longs
community_questions         — Q&R
community_answers           — réponses Q&R
community_reports           — signalements modération
community_user_blocks       — blocage utilisateur
```

### Index critiques

- `community_posts (status, published_at DESC)` — feed paginé
- `community_posts (author_id, created_at DESC)` — profil
- `community_comments (post_id, created_at)`
- `community_likes (target_type, target_id)` + unique `(user_id, target_type, target_id)`
- `community_questions (status, created_at DESC)`
- `community_answers (question_id, vote_score DESC)`
- `community_media (owner_id, created_at DESC)`

### Extensibilité Phase 2/3 (non implémenté)

- `community_groups`, `community_badges`, `community_reputation_events`
- `community_trading_signals` — réservé colonnes `meta jsonb` sur profiles

---

## 5. Structure API REST

Préfixe : `/api/community/`

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/overview` | Hub cards + compteurs |
| GET | `/feed` | Posts paginés (`cursor`, `limit`) |
| POST | `/feed` | Créer post texte/image |
| GET | `/feed/[id]` | Détail post |
| PATCH | `/feed/[id]` | Éditer (auteur) |
| DELETE | `/feed/[id]` | Supprimer (auteur/mod) |
| POST | `/feed/[id]/like` | Toggle like |
| GET | `/feed/[id]/comments` | Liste commentaires |
| POST | `/feed/[id]/comments` | Commenter |
| GET | `/blogs` | Liste articles |
| POST | `/blogs` | Créer brouillon |
| GET | `/blogs/[slug]` | Lecture |
| PATCH | `/blogs/[slug]` | Éditer |
| GET | `/questions` | Liste Q&R |
| POST | `/questions` | Poser question |
| POST | `/questions/[id]/answers` | Répondre |
| POST | `/answers/[id]/vote` | Voter |
| POST | `/answers/[id]/accept` | Accepter (auteur question) |
| GET | `/profiles/me` | Mon profil communauté |
| PATCH | `/profiles/me` | Éditer bio/avatar/pseudo |
| GET | `/profiles/[handle]` | Profil public |
| POST | `/media/upload-url` | Presigned R2 upload |
| POST | `/media/confirm` | Valider MIME/taille → `community_media` |
| POST | `/reports` | Signaler contenu |
| POST | `/blocks` | Bloquer utilisateur |
| GET | `/formations` | Proxy academy sessions (read-only) |

**Auth** : `getSessionUserId()` sur toutes les routes sauf GET publics feed/blogs/questions.

**Rate limit** (à ajouter) : 30 posts/h, 60 comments/h, 10 uploads/h par user.

---

## 6. Structure Frontend PWA

```
src/app/app/community/
  layout.tsx              — community-theme, DataSaverProvider
  page.tsx                — Hub (cartes modules)
  feed/page.tsx           — Fil (Phase 1b)
  blogs/page.tsx          — Liste blogs (Phase 2)
  blogs/[slug]/page.tsx
  formations/page.tsx     — Calendrier academy
  questions/page.tsx      — Q&R (Phase 2)
  u/[handle]/page.tsx     — Profil public

src/components/community/
  community-hub.tsx       — Cartes illustrées SVG
  community-feed-card.tsx
  community-module-icon.tsx
  data-saver-toggle.tsx

src/lib/community/
  types.ts
  config.ts               — limites taille, catégories
  feed-service.ts
  blog-service.ts
  qa-service.ts
  profile-service.ts
  moderation-service.ts
  media-r2.ts             — presign + variants
  data-saver.ts           — préférences locale + API flag
```

**Mobile first** : une colonne, cartes compactes, infinite scroll `@tanstack/react-virtual` ou intersection observer natif (pas de lib lourde en Phase 1).

**Code splitting** : `dynamic(() => import(...), { loading: () => <FeedSkeleton /> })`

---

## 7. Stratégie stockage médias

### Images → Cloudflare R2

```
mcbuleli-community/
  avatars/{userId}/{uuid}.webp
  posts/{yyyy}/{mm}/{uuid}_thumb.webp
  posts/{yyyy}/{mm}/{uuid}_medium.webp
  posts/{yyyy}/{mm}/{uuid}_orig.webp
  blogs/{slug}/cover.webp
```

**Workflow**

1. Client demande `POST /api/community/media/upload-url`
2. Serveur valide auth + quota → presigned PUT R2 (15 min TTL)
3. Client upload direct R2
4. Client `POST /api/community/media/confirm` → scan MIME, taille, antivirus (ClamAV worker ou Cloudflare Images)
5. Worker génère thumb/medium WebP (sharp côté worker interne `/api/internal/community/process-media`)
6. Insert `community_media` avec URLs publiques `https://media.mcbuleli.org/...`

**PostgreSQL** : jamais le binaire — uniquement `id, owner_id, file_url, variants, file_type, size_bytes, created_at`.

### Vidéos → Cloudflare Stream (recommandé)

1. `POST /api/community/media/stream-upload` → URL TUS Stream
2. Webhook Stream `video.ready` → miniature auto + HLS
3. `community_media.stream_id` + `playback_url`

**Alternative R2** : fichiers MP4 max 100 MB + miniature frame 1 — moins optimal pour 3G.

### Limites

| Type | Max | MIME |
|------|-----|------|
| Image | 10 MB | image/jpeg, image/png, image/webp, image/avif |
| Vidéo | 100 MB | video/mp4, video/webm |

---

## 8. Estimation coûts Cloudflare R2

Hypothèse : **3 000 MAU**, 500 posts/mois, 2 images/post moyenne 800 KB → ~800 GB/an stockage cumulé.

| Poste | Calcul | Coût/mois |
|-------|--------|-----------|
| Stockage 70 GB | 70 × $0.015 | ~$1.05 |
| Class A (10k uploads) | négligeable | <$0.01 |
| Class B (500k lectures) | 0.5M × $0.36/M | ~$0.18 |
| Egress | Gratuit via R2 | $0 |

**Total R2 estimé** : **$2–5/mois** (phase initiale), **$15–30/mois** à 10k MAU actifs.

---

## 9. Estimation coûts Cloudflare Stream

Hypothèse : 50 vidéos/mois, 3 min moyenne, 2 000 vues/mois.

| Poste | Calcul | Coût/mois |
|-------|--------|-----------|
| Stockage 150 min | 150 × $5/1000 | ~$0.75 |
| Delivery 6 000 min | 6k × $1/1000 | ~$6.00 |

**Total Stream** : **$7–15/mois** (faible volume), **$50–120/mois** si webinars vidéo fréquents.

**Recommandation Phase 1** : images R2 seulement ; Stream en Phase 1b quand feed vidéo activé.

---

## 10. Plan de migration sans interruption

| Étape | Action | Downtime |
|-------|--------|----------|
| M1 | `0065_community_hub_foundation.sql` sur Render (tables vides) | 0 |
| M2 | Deploy app avec nav + hub (feature flag `COMMUNITY_ENABLED`) | 0 |
| M3 | Config R2 bucket + env vars Render | 0 |
| M4 | Activer feed lecture seule (seed staff) | 0 |
| M5 | Activer création posts utilisateurs | 0 |
| M6 | Blogs + Q&R | 0 |

**Feature flag** : `NEXT_PUBLIC_COMMUNITY_ENABLED=true` — si false, hub affiche « Bientôt » sans casser la nav.

**Rollback** : désactiver flag ; tables restent (pas de drop).

---

## 11. Plan d'implémentation par étapes

### Récompenses Buleli Points (BP)

Intégré au système existant (`tryGrantRewardPoints`, `users.buleli_points_balance`, ledger).

| Action | BP | Plafond / jour |
|--------|-----|----------------|
| Profil communauté complété | 20 | 1× (vie) |
| Bonus 1ère publication | 50 | 1× (vie) |
| Post texte | 25 | 8 |
| Post + image | 40 | 8 |
| Post + vidéo | 60 | 5 |
| Commentaire | 8 | 30 |
| Like (donné) | 3 | 50 |
| Like reçu (auteur) | 5 | 100 |
| Partage | 12 | 15 |
| Article blog publié | 100 | 3 |
| Question posée | 20 | 8 |
| Réponse | 25 | 20 |
| Réponse acceptée | 50 | 10 |
| Vote sur réponse | 5 | 40 |
| Live formation rejoint | 35 | 5 |

- Plafond mensuel global : **4 000 BP** (toutes sources)
- Conversion future : **100 BP = 1 McB** (`REWARD_BP_PER_MCB_CLAIM`)
- Service : `src/lib/community/rewards-service.ts`
- Catalogue UI : `GET /api/community/rewards`

### Phase 1 — Fondations (semaine 1–2) ✅ en cours

- [x] Schéma DB + migration
- [x] Nav « Community » (6e onglet)
- [x] Hub `/app/community` (cartes SVG)
- [x] `GET /api/community/overview`
- [x] Module `src/lib/community/*` squelette
- [x] Data Saver préférence locale
- [x] Récompenses BP (config + service + carte hub)
- [ ] R2 presign upload (images)
- [ ] Profil communauté minimal

### Phase 1b — Fil d'actualité ✅

- [x] Feed CRUD + likes + commentaires + partage
- [x] BP automatiques à chaque action (`rewards-service`)
- [x] Notifications `community_comment`, `community_like`
- [x] Infinite scroll + lazy images + compression WebP
- [x] Upload image (`POST /api/community/media`)
- [x] Signalement (`POST /api/community/reports`)

### Phase 2 — Blogs + Q&R (semaine 5–8)

- Éditeur mobile markdown léger
- Catégories blog
- StackOverflow simplifié (vote, accept)
- Profils publics `/u/[handle]`

### Phase 2b — Formations façade

- Calendrier unifié academy + rappels
- Cartes « Rejoindre live » → JWT existant

### Phase 3 — Préparation (pas d'implémentation)

- Tables `meta` / events réputation
- Specs groupes, badges, signaux trading

---

## 12. Sécurité & modération

- Validation Zod serveur sur tous les POST/PATCH
- Rate limiting par IP + userId (Redis ou table `rate_limit_buckets` — Phase 1b)
- Contenu : longueur max, pas de HTML brut (markdown sanitizé `remark` + allowlist)
- Signalements → queue staff `community_reports`
- Blocage → filtre feed côté SQL `NOT EXISTS (blocks)`
- Spam : délai min 30s entre posts même user

---

## Variables d'environnement (nouvelles)

```env
COMMUNITY_ENABLED=true
COMMUNITY_R2_BUCKET=mcbuleli-community
COMMUNITY_R2_ACCOUNT_ID=
COMMUNITY_R2_ACCESS_KEY_ID=
COMMUNITY_R2_SECRET_ACCESS_KEY=
COMMUNITY_R2_PUBLIC_BASE_URL=https://media.mcbuleli.org
CLOUDFLARE_STREAM_API_TOKEN=   # Phase 1b vidéo
```

---

## Fichiers créés Phase 1

| Fichier | Rôle |
|---------|------|
| `drizzle/0065_community_hub_foundation.sql` | Migration |
| `src/db/schema.ts` | Tables community_* |
| `src/lib/community/*` | Services |
| `src/app/app/community/page.tsx` | Hub UI |
| `src/app/api/community/overview/route.ts` | API hub |
| `src/components/mobile/app-bottom-nav.tsx` | Nav Community |

**Aucune modification** des services wallet, p2p, trade, kyc, academy-live.
