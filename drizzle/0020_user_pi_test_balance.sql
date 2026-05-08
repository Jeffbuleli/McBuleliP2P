-- Per-user Pi Test sandbox balance (replaces legacy global platform_settings pi_test_balance for wallet display).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pi_test_balance" numeric(36, 18) NOT NULL DEFAULT '0';

ALTER TABLE "pi_test_ledger_entries" ADD COLUMN IF NOT EXISTS "user_id" uuid;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pi_test_ledger_entries_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "pi_test_ledger_entries"
      ADD CONSTRAINT "pi_test_ledger_entries_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "pi_test_ledger_user_idx" ON "pi_test_ledger_entries" ("user_id");
