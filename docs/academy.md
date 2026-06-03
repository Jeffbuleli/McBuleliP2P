# McBuleli Academy — Phase A

Espace de formation souverain (sans Google Classroom / Teams comme LMS).

## URLs

| Page | URL |
|------|-----|
| Hub (connecté) | `/app/academy` |
| Cohorte juin 2026 | `/app/academy/juin-2026?program=launch-crypto-trading-ia-p2p` |
| Quiz fondamentaux | `/app/academy/quiz/fondamentaux?edition=juin-2026` |
| Vérification badge | `/verify/{verifyCode}` |
| Inscription publique | `/formation` |
| Admin inscriptions | `/admin/training-registrations` |

## Migration prod

```bash
npm run db:migrate:render
```

Fichier : `drizzle/0056_academy.sql`

Le seed de la cohorte juin 2026 s’exécute automatiquement au premier accès API Academy.

## Buleli Points

| Action | Grant type | BP |
|--------|------------|-----|
| Inscription cohorte | `training_enrolled` | 25 |
| Présence session live | `training_session_attended` | 40 |
| Quiz ≥ 70 % | `training_quiz_passed` | 60 |

## Paiement USDT (formations payantes futures)

`POST /api/academy/enroll` débite le wallet si `academy_programs.price_usdt` > 0 (ledger `academy_enrollment`).

## Liaison inscription /formation

À la connexion ou inscription compte, l’email est relié à `training_registrations.user_id` et l’utilisateur est inscrit à la cohorte juin si possible.
