-- LP Pool payout windows per position (bi-weekly), plus per-position reward balances.
ALTER TABLE "lp_pool_positions"
  ADD COLUMN IF NOT EXISTS "payout_anchor_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "next_payout_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "last_payout_at" timestamp with time zone;

-- Backfill anchors for existing rows (anchor = started_at).
UPDATE "lp_pool_positions"
SET
  "payout_anchor_at" = COALESCE("payout_anchor_at", "started_at"),
  "next_payout_at" = COALESCE("next_payout_at", "started_at" + interval '14 days')
WHERE "payout_anchor_at" IS NULL OR "next_payout_at" IS NULL;

CREATE TABLE IF NOT EXISTS "lp_pool_position_reward_balances" (
  "position_id" uuid PRIMARY KEY REFERENCES "lp_pool_positions"("id") ON DELETE CASCADE,
  "available_usdt" numeric(36, 18) NOT NULL DEFAULT '0',
  "total_earned_usdt" numeric(36, 18) NOT NULL DEFAULT '0',
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "lp_pool_positions_next_payout_idx"
  ON "lp_pool_positions" ("next_payout_at" ASC);

