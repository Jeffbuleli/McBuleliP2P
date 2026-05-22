# AVEC on McBuleli

McBuleli implements **AVEC** (Association villageoise d’épargne et de crédit) — community savings groups where members pool USDT in a **group treasury**, follow a **charter**, and operate on **cycles** with weekly (or custom) **share purchases**.

References: [ICI Cocoa Initiative implementation guide](https://www.cocoainitiative.org/fr/centre-de-ressources/ressources/guide-dimplementation-associations-villageoises-depargne-et-de), [50MAWSP — AVEC R.D. Congo](https://share.google/aqDKkozFFvF3p7LzB).

## Principles mapped to the app

| AVEC practice | McBuleli |
|---------------|----------|
| 15–25 members, same social level | `minMembers` / `maxMembers` (defaults 15–25) |
| Weekly meetings | `meetingIntervalDays` (default 7) |
| 1–5 shares per meeting, fixed share value per cycle | `contributionAmountUsdt` + `maxSharesPerMeeting` (max 5) |
| Cycle ~9–12 months | `cycleDurationDays` (default 360) |
| Social / solidarity fund | `socialFundUsdt` (optional per meeting) |
| Member-managed decisions | Admin + up to 3 co-admins; charter in `paymentRules` |
| Transparent ledger | Group treasury ledger + audit log |
| External facilitator, not custodian of cash | Ops approves group; McBuleli holds USDT treasury only |

**LIKELEMBA** is removed from the product. Legacy DB rows may still have `type = likelimba`; new groups are always `avec`.

## Super-admin test mode

Groups **created by a `super_admin`** user:

- Start as **`active`** with **`subscriptionStatus: active`** (no Ops queue, no $5/mo billing).
- Monthly subscription job **skips** them (treasury is never debited for platform fee; group is not suspended for unpaid subscription).

## Member flows

1. **Create AVEC** → status `pending` → Ops approves → `active` (unless super-admin test above).
2. **Join** → admin/co-admin approves membership.
3. **Meeting** → member selects 1–5 shares → USDT debited from user wallet → treasury credited.
4. **Subscription** → $5/month from group treasury (suspension if unpaid).
5. **Payouts / loans** → admin/co-admin payout from treasury (existing API); future: loan requests tied to cycle rules.

## In-app experience

- **Top bar**: McBuleli brand (left) · notifications · AVEC logo + name (right).
- **Chat**: member messaging inside the group (`group_messages`).
- **Reports**: McBuleli ledger entries = on-platform USDT proof; audit for managers.
- **Payouts**: managers send USDT rewards from treasury to member McBuleli wallets.
- **Profile** (admin): name, logo, address, phone, email, description.

## APIs

- `POST /api/groups` — create AVEC only.
- `POST /api/groups/:id/contributions` — `{ shares: 1..5 }` or `{ amountUsdt }` (McBuleli USDT wallet).
- `GET/POST /api/groups/:id/messages` — group chat.
- `PATCH /api/groups/:id/profile` — AVEC branding (admin).
- `GET /api/groups/:id/activity` — ledger + proofs + audit.
- `GET /api/groups/:id` — dashboard with per-member `savedUsdt`, `sharesTotal`.

## Migration

Run `drizzle/0029_avec_model.sql` (or full Drizzle migrate) for:

- `max_shares_per_meeting`
- `meeting_interval_days`
- `social_fund_usdt`
