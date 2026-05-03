-- Remove OKX lane / agent specialization columns (run if upgrading from 0002)
DROP INDEX IF EXISTS "withdrawals_payout_lane_idx";
ALTER TABLE "withdrawals" DROP COLUMN IF EXISTS "payout_lane";
ALTER TABLE "users" DROP COLUMN IF EXISTS "withdrawal_lane";
