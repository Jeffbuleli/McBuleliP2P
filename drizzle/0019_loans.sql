-- Loans (USDT) — secured by LP pool principal (v1)

CREATE TABLE IF NOT EXISTS "loans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "asset" varchar(8) NOT NULL DEFAULT 'USDT',
  "principal_usdt" numeric(36, 18) NOT NULL DEFAULT '0',
  "outstanding_usdt" numeric(36, 18) NOT NULL DEFAULT '0',
  "status" varchar(16) NOT NULL DEFAULT 'open', -- open | repaid | defaulted
  "apr_annual" numeric(12, 6) NOT NULL DEFAULT '0',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "loans_user_status_idx" ON "loans" ("user_id", "status");

CREATE TABLE IF NOT EXISTS "loan_collaterals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "loan_id" uuid NOT NULL REFERENCES "loans"("id") ON DELETE CASCADE,
  "collateral_type" varchar(24) NOT NULL, -- lp_pool_position
  "collateral_id" uuid NOT NULL, -- position_id
  "collateral_usdt" numeric(36, 18) NOT NULL DEFAULT '0',
  "ltv" numeric(12, 6) NOT NULL DEFAULT '0.5',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "loan_collaterals_loan_collateral_uidx" UNIQUE ("loan_id", "collateral_type", "collateral_id")
);

CREATE INDEX IF NOT EXISTS "loan_collaterals_loan_idx" ON "loan_collaterals" ("loan_id");

CREATE TABLE IF NOT EXISTS "loan_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "loan_id" uuid NOT NULL REFERENCES "loans"("id") ON DELETE CASCADE,
  "event_type" varchar(24) NOT NULL, -- disburse | repay
  "amount_usdt" numeric(36, 18) NOT NULL,
  "meta" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "loan_events_loan_idx" ON "loan_events" ("loan_id", "created_at" DESC);

