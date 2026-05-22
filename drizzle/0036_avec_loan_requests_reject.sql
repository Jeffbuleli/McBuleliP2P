ALTER TABLE "group_avec_loans"
  ADD COLUMN IF NOT EXISTS "rejection_reason" text;

ALTER TABLE "group_avec_loans"
  ADD COLUMN IF NOT EXISTS "interest_rate_pct_month" numeric(8, 4) NOT NULL DEFAULT 2;

ALTER TABLE "group_avec_loans"
  ADD COLUMN IF NOT EXISTS "penalty_rate_pct" numeric(8, 4) NOT NULL DEFAULT 5;

ALTER TABLE "group_avec_loans"
  ADD COLUMN IF NOT EXISTS "loan_term_days" integer NOT NULL DEFAULT 90;

ALTER TABLE "group_payout_requests"
  ADD COLUMN IF NOT EXISTS "rejection_reason" text;
