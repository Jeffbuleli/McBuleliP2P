# MetaMap KYC — setup checklist (McBuleli)

Partner: [MetaMap](https://docs.metamap.com/). McBuleli uses the **Web SDK** (button + liveness). Server webhooks are optional until you upgrade from the free plan.

## 0. Plan MetaMap FREE vs Full

| | **FREE** (your current plan) | **Full / paid** (after tests) |
|---|------------------------------|-------------------------------|
| Web SDK (Client ID + Flow ID) | ✅ | ✅ |
| REST API server-to-server | ❌ | ✅ |
| Webhooks (`verification_completed`) | ❌ or limited | ✅ |
| `METAMAP_WEBHOOK_SECRET` | Not required on FREE | Set when webhooks are enabled |

**On FREE:** users verify via the SDK on `/app/profile/kyc`. Status is updated through **`POST /api/kyc/sync`** when the user finishes the flow (started / finished / exited). You can enable **`KYC_ENABLED=true`** and MetaMap public env vars without webhooks.

**After upgrade:** add webhook URL + secret for automatic status updates without relying only on the client.

## 1. MetaMap Dashboard

1. Account: [dashboard.metamap.com](https://dashboard.metamap.com).
2. Create a **Workflow** for corridor countries (CD, RW, etc.): document + liveness (+ AML when available).
3. Copy **Client ID** and **Flow ID** (flow → **Integration** tab).
4. **Redirection / allowed domains (required):** add **`https://mcbuleli.org`** in [Redirection settings](https://docs.metamap.com/docs/redirection-settings). Without this, the SDK shows *“Something went wrong”* (`commonError` / `ipRestrictions`).
5. **Webhooks (Full plan only):** URL `https://mcbuleli.org/api/webhooks/metamap` — see secret section below.

### Where is `METAMAP_WEBHOOK_SECRET`? (Full plan)

The secret is **not** a separate menu item. It appears when you save a webhook on the flow:

1. Open your **Workflow / Flow** → **Integration** → **Webhooks**
2. URL: `https://mcbuleli.org/api/webhooks/metamap`
3. After save: copy **Signing secret** / **Webhook secret** (shown once)

If you cannot find it (FREE plan): leave `METAMAP_WEBHOOK_SECRET` **empty**. McBuleli skips signature checks when unset.

## 2. McBuleli env (Render)

```env
KYC_ENABLED=true
KYC_REQUIRED_COUNTRIES=CD,RW,TZ,BI,UG,KE,CG,CM,NG,GH,SN,CI
NEXT_PUBLIC_APP_URL=https://mcbuleli.org
NEXT_PUBLIC_METAMAP_CLIENT_ID=...
NEXT_PUBLIC_METAMAP_FLOW_ID=...
# After Full plan + webhook configured:
METAMAP_WEBHOOK_SECRET=...
```

Migration **0037** on Postgres:

```bash
npm run db:migrate:render
```

## 3. User flow

1. Profile → **Verify identity** (`/app/profile/kyc`)
2. Progress: Prepare → ID → Face → Review
3. MetaMap SDK button (`metadata.userId` links the McBuleli user)
4. **FREE:** `POST /api/kyc/sync` on finish → `kyc_status` pending, then manual review in MetaMap dashboard or upgrade + webhooks later
5. **Full:** webhook sets `approved` | `manual_review` | `rejected` + in-app notifications
6. **KYC verified** badge on Profile, P2P, AVEC members, chatroom, top bar

## 4. Gated services (`KYC_ENABLED` + corridor country)

| Service | API |
|---------|-----|
| Withdraw | `POST /api/withdrawals` |
| Transfer | `POST /api/wallet/transfer` |
| Mobile money | fiat deposit / withdraw |
| P2P trade | `POST /api/p2p/orders` |
| AVEC | groups create / join / contribute |
| Live trade | live-enable, futures open |

## 5. Domain & PWA (mcbuleli.org)

- Canonical site: **`https://mcbuleli.org`**
- **`mcbuleli.online`** and **`www.*`** redirect to `.org` (one home-screen app, one icon set).
- If two McBuleli icons exist on the phone: remove the old shortcut, reinstall from **mcbuleli.org** only.

## 6. Troubleshooting

| Issue | Fix |
|-------|-----|
| Login: “Database tables are missing” | `npm run db:push:render` with production `DATABASE_URL` |
| Blank KYC page | Migration 0037, country in profile, `KYC_ENABLED`, MetaMap `NEXT_PUBLIC_*` |
| SDK works, status stuck | FREE plan: rely on `/api/kyc/sync`; or upgrade + webhook |

## References

- [Web quick start](https://docs.metamap.com/docs/web-quick-start)
- [Webhook specifications](https://docs.metamap.com/docs/webhook-specifications)
- [Configure webhook URL](https://docs.metamap.com/docs/configure-your-webhook-url)
