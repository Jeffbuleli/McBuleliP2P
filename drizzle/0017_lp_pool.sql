-- LP Pool (internal liquidity providers) — reward share distribution at 01:00 GMT (24h windows)
CREATE TABLE IF NOT EXISTS "lp_pool_positions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "asset" varchar(8) NOT NULL DEFAULT 'USDT',
  "amount" numeric(36, 18) NOT NULL,
  "lock_months" integer NOT NULL,
  "size_tier" varchar(8) NOT NULL,
  "lock_tier" varchar(8) NOT NULL,
  "size_multiplier" numeric(12, 6) NOT NULL,
  "lock_multiplier" numeric(12, 6) NOT NULL,
  "shares" numeric(36, 18) NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "status" varchar(16) NOT NULL DEFAULT 'active',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "lp_pool_positions_user_idx"
  ON "lp_pool_positions" ("user_id");
CREATE INDEX IF NOT EXISTS "lp_pool_positions_status_ends_idx"
  ON "lp_pool_positions" ("status", "ends_at");

-- One row per day distribution (01:00 GMT → 01:00 GMT)
CREATE TABLE IF NOT EXISTS "lp_pool_daily_distributions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "day_start_at" timestamp with time zone NOT NULL,
  "day_end_at" timestamp with time zone NOT NULL,
  "distribution_rate" numeric(12, 6) NOT NULL,
  "revenue_net_usdt" numeric(36, 18) NOT NULL DEFAULT '0',
  "reward_pool_usdt" numeric(36, 18) NOT NULL DEFAULT '0',
  "total_shares" numeric(36, 18) NOT NULL DEFAULT '0',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "lp_pool_daily_distributions_day_start_unique" UNIQUE ("day_start_at")
);

CREATE INDEX IF NOT EXISTS "lp_pool_daily_distributions_day_idx"
  ON "lp_pool_daily_distributions" ("day_start_at" DESC);

-- Append-only rewards ledger (accruals per day + payouts during windows)
CREATE TABLE IF NOT EXISTS "lp_pool_reward_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "position_id" uuid REFERENCES "lp_pool_positions"("id") ON DELETE SET NULL,
  "kind" varchar(16) NOT NULL, -- accrual | payout
  "day_start_at" timestamp with time zone, -- set for accruals
  "amount_usdt" numeric(36, 18) NOT NULL,
  "meta" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "lp_pool_reward_entries_user_idx"
  ON "lp_pool_reward_entries" ("user_id", "created_at" DESC);

-- Idempotency for accruals: one accrual per (day_start_at, position_id)
CREATE UNIQUE INDEX IF NOT EXISTS "lp_pool_reward_entries_accrual_uidx"
  ON "lp_pool_reward_entries" ("day_start_at", "position_id")
  WHERE "kind" = 'accrual' AND "day_start_at" IS NOT NULL AND "position_id" IS NOT NULL;

-- Fast balances for UI (updated by the daily job + payout)
CREATE TABLE IF NOT EXISTS "lp_pool_reward_balances" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "available_usdt" numeric(36, 18) NOT NULL DEFAULT '0',
  "total_earned_usdt" numeric(36, 18) NOT NULL DEFAULT '0',
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

