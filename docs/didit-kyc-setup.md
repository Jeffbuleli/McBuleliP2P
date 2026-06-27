# Didit KYC — setup checklist (McBuleli)

Partner: [Didit](https://docs.didit.me/). McBuleli uses the **Sessions API** + **JavaScript SDK** + **webhooks** for real-time status updates.

## 1. Didit Business Console

1. Account: [business.didit.me](https://business.didit.me)
2. **Workflow (KYC)** for corridor countries — recommended steps:
   - **ID Verification** — enable **Congo (COD)** with subtypes **`VOTER_CARD`** + `ID_CARD_GENERIC`
   - **Passive Liveness** + **Face Match 1:1**
   - Optional: **AML Screening** for sanctions/watchlist
3. **Publish** the workflow and copy **Workflow ID** → `DIDIT_WORKFLOW_ID`
4. **API & Webhooks** → copy **API key** → `DIDIT_API_KEY`
5. **Webhook destination** (V3):
   - URL: `https://mcbuleli.org/api/webhooks/didit`
   - Version: **V3**
   - Events: `status.updated`, `user.status.updated` (optional: `data.updated`)
   - Copy **secret_shared_key** → `DIDIT_WEBHOOK_SECRET` on Render (exact match, no quotes)
6. **Try Webhook** — avec `X-Didit-Test-Webhook: true`, McBuleli répond **200** (signature console non bloquante). Réponse typique : `{ "ok": true, "skipped": "no_user" }` car `vendor_data` d’exemple n’est pas un UUID utilisateur.
7. **Production** : `vendor_data` = UUID McBuleli (envoyé à la création de session). Vérifiez que `DIDIT_WEBHOOK_SECRET` = **secret_shared_key** de la destination (≠ `DIDIT_API_KEY`).

### RDC — carte d'électeur (2022–2023)

Didit lists **COD** with subtype **`VOTER_CARD`** in the live document catalogue ([supported documents](https://docs.didit.me/core-technology/id-verification/supported-documents-id-verification)). There is **no CENI database validation** — verification is OCR + liveness + face match + template checks.

User guidance in-app: recto + verso, good light, no glare.

## 2. McBuleli env (Render)

```env
KYC_ENABLED=true
KYC_REQUIRED_COUNTRIES=CD,RW,TZ,BI,UG,KE,CG,CM,NG,GH,SN,CI
NEXT_PUBLIC_APP_URL=https://mcbuleli.org
DIDIT_API_KEY=...
DIDIT_WORKFLOW_ID=...
DIDIT_WEBHOOK_SECRET=...
```

Run migrations **0037** + **0038** on Postgres (required — without `didit_session_id` the KYC page returns 500):

```bash
# From repo root, with Render External DATABASE_URL in .env.render
npm run db:migrate:render
```

Or run once in Render Postgres **Shell** / SQL console:

```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_rejection_note" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "didit_session_id" varchar(128);
```

## 3. User flow

1. Profile → **Verify identity** (`/app/profile/kyc`)
2. Tap **Vérifier** → `POST /api/kyc/session` creates a Didit session (`vendor_data` = McBuleli user UUID)
3. Didit SDK modal: ID capture → selfie → processing
4. **Webhook** `status.updated` → `approved` | `manual_review` | `rejected` + in-app notification
5. Fallback: `GET /api/kyc/status` auto-polls Didit decision API; cron `mcbuleli-kyc-sync` every 10 min

## 4. Gated services (`KYC_ENABLED` + corridor country)

Same as before: withdraw, transfer, P2P, AVEC, live trade, fiat mobile money.

## 5. Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank KYC modal (white overlay) | CSP must allow `frame-src https://verify.didit.me` (SDK iframe), not only `verification.didit.me` |
| Blank KYC / not configured | `KYC_ENABLED`, `DIDIT_API_KEY`, `DIDIT_WORKFLOW_ID`, migration 0038 |
| SDK opens but status stuck pending | Configure webhook + `DIDIT_WEBHOOK_SECRET`; check Render logs for `[didit webhook]` |
| Declined — blurry document | Retake voter card photos (front + back), good light |
| Declined — AML / sanctions | Didit AML hit; user blocked from retry if sanctions note |
| Out of credits | Top up at [business.didit.me](https://business.didit.me) |

## References

- [Quick Start](https://docs.didit.me/getting-started/quick-start)
- [Create Session API](https://docs.didit.me/sessions-api/create-session)
- [JavaScript SDK](https://docs.didit.me/integration/web-sdks/javascript-sdk)
- [Webhooks](https://docs.didit.me/integration/webhooks)
- [Verification statuses](https://docs.didit.me/integration/verification-statuses)
