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
| **Live** | Bouton « Rejoindre le live » pendant la fenêtre session ; URL = `session.live_url` → `edition.live_base_url` → `NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL` → fallback `meet.jit.si/mcbuleli-{edition}-{session}` |
| **Admin** | `/admin/academy` — inscriptions par édition + export CSV |
| **Pro (brouillon)** | Programme `crypto-trading-pro` · 49 USDT · édition `q3-2026` en `draft` |

## Migrations prod (obligatoire après déploiement Academy)

```bash
npm run db:migrate:render
```

Journal Drizzle : `0055_training_registrations`, `0056_academy`, `0057_academy_phase_b`, `0058_academy_phase_c`.

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
```

Sinon : salles Jitsi publiques `meet.jit.si/mcbuleli-juin-2026-{session}` (Phase C = self-hosted Jitsi/LiveKit).

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

## Prochaine étape produit

| Priorité | Sujet |
|----------|--------|
| **Commit suivant** | `content/email-broadcasts/` — campagne lancement Academy (voir `docs/launch-campaign.md`) |
| Optionnel | Live self-hosted (Jitsi/LiveKit), VOD replays (R2) |
| Ops | Cron `mcbuleli-academy-reminders` sur Render + replays admin après chaque session |
