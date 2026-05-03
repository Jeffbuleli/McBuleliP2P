-- Payout lane, route fee row, agent assignment, operator lane on users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "withdrawal_lane" varchar(16);
ALTER TABLE "withdrawals" ADD COLUMN IF NOT EXISTS "payout_lane" varchar(16) NOT NULL DEFAULT 'binance';
ALTER TABLE "withdrawals" ADD COLUMN IF NOT EXISTS "assigned_to_user_id" uuid;
DO $$ BEGIN
  ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
CREATE INDEX IF NOT EXISTS "withdrawals_payout_lane_idx" ON "withdrawals" USING btree ("payout_lane");
CREATE INDEX IF NOT EXISTS "withdrawals_assigned_idx" ON "withdrawals" USING btree ("assigned_to_user_id");
