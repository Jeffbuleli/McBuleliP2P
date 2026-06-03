# McBuleli Academy

Espace de formation souverain (sans Google Classroom / Teams comme LMS).

## Phase A — Ops

| Page | URL |
|------|-----|
| Hub (connecté) | `/app/academy` |
| Cohorte juin 2026 | `/app/academy/juin-2026?program=launch-crypto-trading-ia-p2p` |
| Quiz fondamentaux | `/app/academy/quiz/fondamentaux?edition=juin-2026` |
| Vérification badge | `/verify/{verifyCode}` |
| Inscription publique | `/formation` |
| Admin inscriptions (legacy) | `/admin/training-registrations` |

## Phase B — Cohorte & IA

| Feature | Détail |
|---------|--------|
| **Chat cohorte** | `/api/academy/editions/{slug}/messages` — inscrits uniquement |
| **Tuteur IA** | `/api/academy/tutor` — RAG `category=academy`, tags `edition:{slug}` |
| **Live** | Salle companion `/app/academy/{edition}/live/{session}` (chat léger + conseils) ; vidéo sur Jitsi (360p, partage écran, lever la main) ; **20 min** initiales = réglages ; URL = `session.live_url` → `edition.live_base_url` → Jitsi `meet.jit.si/mcbuleli-{edition}-{session}` |
| **Admin** | `/admin/academy` — inscriptions par édition + export CSV |
| **Pro** | Programme `crypto-trading-pro` · **49 USDT** (wallet) · édition `q3-2026` **ouverte** · KYC requis |

## Migrations prod (obligatoire après déploiement Academy)

```bash
npm run db:migrate:render
```

Journal Drizzle : `0055` … `0061_academy_edition_hosts`.

Sans ces migrations : `/formation` et `/app/academy` renvoient HTTP 503 `academy_db_not_migrated`.

Le seed cohorte + syllabus IA s’exécute au premier accès API Academy.

## Buleli Points

| Action | Grant type | BP |
|--------|------------|-----|
| Inscription cohorte | `training_enrolled` | 25 |
| Présence session live | `training_session_attended` | 40 |
| Quiz ≥ 70 % | `training_quiz_passed` | 60 |

## Paiement USDT

`POST /api/academy/enroll` débite le wallet si `academy_programs.price_usdt` > 0 (ledger `academy_enrollment`).

## Env live (optionnel)

```env
NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL=https://live.mcbuleli.org
# Optionnel — iframe dans la salle companion (recommandé avec live self-host)
NEXT_PUBLIC_ACADEMY_LIVE_EMBED=true
```

Sinon : salles Jitsi publiques `meet.jit.si/mcbuleli-juin-2026-{session}` (préréglages bas débit dans `src/lib/academy-live.ts`).

**Co-animateurs (P4)** : admin `/admin/academy` → ajouter un email McBuleli → lien Jitsi host pour cette cohorte.

### Parcours participant live

1. Cohorte → session **LIVE** → **Salle live** (page légère McBuleli)
2. **Rejoindre le live** → Jitsi (micro, caméra, partage écran, lever la main)
3. **Chat live** sur la même page (pas de vidéo dans l'app = économie data)
4. Premières **20 min** : bandeau « Réglages » (ententes, tests techniques)

## Phase C — Replays, analytics, rappels, Open Badges

| Feature | Détail |
|---------|--------|
| **Replay** | Colonnes `replay_url` / `replay_published_at` sur `academy_sessions` ; bouton « Voir le replay » après fin de session ; `POST /api/academy/replay` logue `replay_viewed` |
| **Learning events** | Table `academy_learning_events` (xAPI-lite) : `enrolled`, `attended`, `quiz_passed`, `replay_viewed`, `credential_issued` |
| **Rappels** | Cron `POST /api/internal/academy/reminders` (header `x-cron-secret`) — notif in-app 24h/1h + email Resend optionnel ; dedupe `academy_session_reminders` |
| **Open Badges** | `GET /api/academy/verify/{code}/openbadge` — JSON-LD Open Badges 2.0 |
| **Annonces** | Message cohorte `messageType=announcement` (staff) → notif `academy_announcement` pour tous les inscrits |
| **Invitation cohorte** | Tout inscrit peut inviter par e-mail (`POST …/invite`) — cohorte gratuite = inscription auto ; payante = notif avec lien |
| **Admin sessions** | `/admin/academy` — édition `live_url` / `replay_url` par session (`PATCH /api/admin/academy`) |

### Cron Render (rappels Academy)

```bash
node scripts/cron-academy-reminders.mjs
```

Recommandé : toutes les 15 min (fenêtres 24h et 1h avec tolérance ±15–20 min).

### Migration prod Phase C

```bash
npm run db:migrate:render
```

Journal : `0058_academy_phase_c`.

## Liaison /formation

À la connexion, email → `training_registrations.user_id` + auto-inscription cohorte juin.

## État du cahier de charge (juin 2026)

| Phase | Statut | Contenu livré |
|-------|--------|----------------|
| **A — Ops** | ✅ | Programmes, éditions, sessions, quiz, badges, BP, `/app/academy`, `/formation`, verify |
| **B — Cohorte & IA** | ✅ | Chat, tuteur RAG, live Jitsi, admin inscriptions Academy |
| **C — Replays & ops** | ✅ | Replays, learning events, rappels cron, Open Badges, invites cohorte, admin sessions |
| **D — Pont /formation** | ✅ | Stats unifiées admin, sync comptes existants, auto-enroll si email = compte McBuleli |

**Hors scope initial (backlog)** : email-broadcasts (commit dédié), Jitsi/LiveKit self-hosted, VOD R2.

### Deux flux d'inscription (important OPS)

| Canal | Table | Quand |
|-------|--------|--------|
| **https://mcbuleli.org/formation** | `training_registrations` | Immédiat, sans compte |
| **Academy in-app** | `academy_enrollments` | Login/register (même email) ou bouton « Rejoindre » · sync admin |

`/admin/academy` affiche les deux totaux. Bouton **Synchroniser /formation → Academy** pour les e-mails qui ont déjà un compte McBuleli. Liste détaillée : `/admin/training-registrations`.

## Open Classroom (companion + Jitsi)

Voir **`docs/academy-open-classroom.md`** — audit, rôles host/apprenant, barre mobile, modes audio/host.

## Vision produit & parcours guidé

Voir **`docs/academy-vision.md`** — audit complet, gap analysis, roadmap, home journey (P0), P1 illustrations + mentor IA.

## Prochaine étape produit

| Priorité | Sujet |
|----------|--------|
| **Commit suivant** | `content/email-broadcasts/` — campagne lancement Academy (voir `docs/launch-campaign.md`) |
| Infra | Voir **`docs/academy-infra.md`** — Jitsi self-host, R2 replays, analytics admin |
| Ops | Cron `mcbuleli-academy-reminders` sur Render + replays admin après chaque session |
