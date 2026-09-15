# eAVEC product architecture

**eAVEC — Digital Community Finance Infrastructure**

McBuleli provides the technology so village savings groups (AVEC), cooperatives, and authorized partners can digitize operations. eAVEC is **not a bank** and does not claim a banking license.

```
             eAVEC
               │
   ┌───────────┼───────────┐
   │           │           │
 eAVEC OS   eAVEC AI   eAVEC PASSPORT
   │           │           │
 Épargne     Insights     Historique
 Crédit      Scoring      portable
 Membres     Analyse      (consentement)
   │           │           │
   └───────────┼───────────┘
               │
          eAVEC AGRI (P3)
```

## Pillars (mapped to this codebase)

| Pillar | Status | Implementation |
|--------|--------|----------------|
| **eAVEC OS** | Live | Groups, shares, treasury buckets, loans, repayments, governance votes, roles — `src/lib/avec/`, `src/app/api/groups/**`, `src/app/app/wallet/groups/**` |
| **eAVEC AI** | Live (MVP) | Deterministic insights + optional LLM rephrase — `src/lib/avec/financial-ai-service.ts`, `GET /api/groups/:id/insights` |
| **eAVEC Passport** | Live (MVP) | Member financial history + Reliability Score + consent — `src/lib/avec/financial-passport.ts`, `financial-reliability-score.ts` |
| **eAVEC Agri** | Future | Architecture reserved in docs only — no product tables yet |

## Stack

- Next.js App Router + React
- PostgreSQL + Drizzle ORM (`src/db/schema.ts`)
- Auth: session JWT; production wallet groups may SSO-handoff to `e-avec.org` (external fork sharing DB/JWT)
- Group treasury: USDT wallet ledger (not bank custody of cash)
- Payments abstraction: `src/lib/avec/payment-provider.ts` (`EAVEC_PAYMENT_MODE=wallet|sandbox`)

## Roles (group)

- `admin` / `co_admin` / `committee` / `member`
- Granular (vote-assigned): `treasurer`, `credit_officer`, `secretary`
- Platform staff: admin scopes for Ops (`requireStaffScope("groups")`)

## Financial Reliability Score

Indicative 0–100 score from objective AVEC behaviour (regularity, repayment, tenure, lateness, KYC flag). **Never auto-approves or rejects a loan.** Committee decides.

## Security notes

- Discoverable groups **do not** expose invite codes
- Loan repayments always debit the **borrower** wallet (managers cannot mint treasury by recording repay without funds)
- Passport share requires explicit consent, expiry, revoke, and audit log access

## Demo

```bash
npm run seed:eavec-umoja
```

Creates **AVEC Umoja** with 10 demo members. See script output for login.

## Sync with e-avec.org

Production `/app/wallet/groups*` redirects to the external repo `Jeffbuleli/avec`. Critical finance/security fixes in this monorepo must be ported to that fork before relying on prod demos.

## Related docs

- [avec-model.md](./avec-model.md)
- [avec-governance-architecture.md](./avec-governance-architecture.md)
- [avec-funds-architecture.md](./avec-funds-architecture.md)
- [avec-menus.md](./avec-menus.md)
