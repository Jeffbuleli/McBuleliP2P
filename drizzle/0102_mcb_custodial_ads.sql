-- SUG Horizon B2: McB custodial accounts + ledger (ads spend / pools)
CREATE TABLE IF NOT EXISTS "mcb_custodial_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kind" varchar(24) NOT NULL,
  "ref_id" uuid,
  "balance" numeric(36, 18) NOT NULL DEFAULT '0',
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "mcb_custodial_accounts_kind_ref_uidx"
  ON "mcb_custodial_accounts" ("kind", "ref_id")
  WHERE "ref_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "mcb_custodial_accounts_kind_pool_uidx"
  ON "mcb_custodial_accounts" ("kind")
  WHERE "ref_id" IS NULL;

CREATE TABLE IF NOT EXISTS "mcb_custodial_ledger" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "batch_id" uuid NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "mcb_custodial_accounts"("id") ON DELETE CASCADE,
  "amount" numeric(36, 18) NOT NULL,
  "entry_type" varchar(40) NOT NULL,
  "meta" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "mcb_custodial_ledger_account_idx"
  ON "mcb_custodial_ledger" ("account_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "mcb_custodial_ledger_batch_idx"
  ON "mcb_custodial_ledger" ("batch_id");

CREATE INDEX IF NOT EXISTS "mcb_custodial_ledger_type_idx"
  ON "mcb_custodial_ledger" ("entry_type", "created_at" DESC);

-- Ensure system pools exist
INSERT INTO "mcb_custodial_accounts" ("kind", "ref_id", "balance")
SELECT 'creator_fund', NULL, '0'
WHERE NOT EXISTS (
  SELECT 1 FROM "mcb_custodial_accounts" WHERE "kind" = 'creator_fund' AND "ref_id" IS NULL
);
INSERT INTO "mcb_custodial_accounts" ("kind", "ref_id", "balance")
SELECT 'burn_queue', NULL, '0'
WHERE NOT EXISTS (
  SELECT 1 FROM "mcb_custodial_accounts" WHERE "kind" = 'burn_queue' AND "ref_id" IS NULL
);
INSERT INTO "mcb_custodial_accounts" ("kind", "ref_id", "balance")
SELECT 'ops_treasury', NULL, '0'
WHERE NOT EXISTS (
  SELECT 1 FROM "mcb_custodial_accounts" WHERE "kind" = 'ops_treasury' AND "ref_id" IS NULL
);
