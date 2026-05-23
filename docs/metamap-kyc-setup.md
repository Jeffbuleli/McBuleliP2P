# MetaMap KYC — setup checklist (McBuleli)

Partner: [MetaMap](https://docs.metamap.com/). Flow: document + liveness via Web SDK; status via webhooks.

## 1. MetaMap Dashboard (your side)

1. Create account at [dashboard.metamap.com](https://dashboard.metamap.com).
2. Create a **Workflow (metamap)** for your corridor countries (CD, RW, etc.):
   - Document verification
   - Biometric / liveness
   - Watchlist (AML) — recommended
3. Copy **Client ID** and **Flow ID** from the workflow.
4. **Integrations → Webhooks**:
   - URL: `https://mcbuleli.org/api/webhooks/metamap`
   - Generate **Webhook secret** (≥16 chars, upper+lower+digit)
   - Whitelist redirect domain: `https://mcbuleli.org` ([redirection settings](https://docs.metamap.com/docs/redirection-settings))
5. If your infra filters IPs, allow MetaMap webhook senders:
   - `52.55.16.54`, `52.5.135.13`, `18.209.133.212`, `52.7.73.154`

## 2. McBuleli env (Vercel / Render)

```env
KYC_ENABLED=true
KYC_REQUIRED_COUNTRIES=CD,RW,TZ,BI,UG,KE,CG,CM,NG,GH,SN,CI
NEXT_PUBLIC_METAMAP_CLIENT_ID=...
NEXT_PUBLIC_METAMAP_FLOW_ID=...
METAMAP_WEBHOOK_SECRET=...
```

Run migration **0037** on Postgres:

```bash
npm run db:migrate:render
```

## 3. User flow

1. Profile → **Verify identity** (`/app/profile/kyc`)
2. Progress bar: Prepare → ID → Face → Review
3. MetaMap button opens SDK (metadata `userId` links webhook → McBuleli user)
4. Webhook `verification_completed` sets `kyc_status`: `approved` | `manual_review` | `rejected`
5. In-app notification on each status change

## 4. Gated services (when `KYC_ENABLED` + corridor country)

| Service | API gate |
|---------|----------|
| Withdraw (USDT/PI) | `POST /api/withdrawals` |
| Wallet transfer | `POST /api/wallet/transfer` |
| Mobile money | `POST /api/wallet/fiat/deposit`, `withdraw` |
| P2P trade | `POST /api/p2p/orders` |
| AVEC create/join/contribute | `POST /api/groups`, `join`, `contributions` |
| Live trade | `POST /api/trade/live-enable`, `futures/open` (live mode) |

Demo trading and wallet **view** remain available before KYC.

## 5. Testing

1. Set `KYC_ENABLED=true` on staging with test MetaMap flow.
2. User with country **CD** → open `/app/profile/kyc` → complete MetaMap.
3. Confirm webhook in MetaMap dashboard logs → user `kyc_status` = `approved`.
4. Retry withdraw — should succeed.

## References

- [Web quick start](https://docs.metamap.com/docs/web-quick-start)
- [Webhook specifications](https://docs.metamap.com/docs/webhook-specifications)
- [Configure webhook URL](https://docs.metamap.com/docs/configure-your-webhook-url)
