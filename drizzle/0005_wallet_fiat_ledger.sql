-- Fiat pockets + immutable wallet ledger (custodial accounting)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "usd_balance" numeric(36, 18) DEFAULT '0' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cdf_balance" numeric(36, 18) DEFAULT '0' NOT NULL;

CREATE TABLE IF NOT EXISTS "wallet_ledger_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "batch_id" uuid NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "entry_type" varchar(32) NOT NULL,
  "asset" varchar(16) NOT NULL,
  "amount" numeric(36, 18) NOT NULL,
  "fee_usd_equivalent" numeric(18, 8) DEFAULT '0' NOT NULL,
  "counterparty_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "meta" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "wallet_ledger_user_idx" ON "wallet_ledger_entries" ("user_id");
CREATE INDEX IF NOT EXISTS "wallet_ledger_batch_idx" ON "wallet_ledger_entries" ("batch_id");
CREATE INDEX IF NOT EXISTS "wallet_ledger_created_idx" ON "wallet_ledger_entries" ("created_at");
