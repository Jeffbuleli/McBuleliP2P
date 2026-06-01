-- Phase 3: KYC-gated BP → McB on-chain claim queue
CREATE TABLE IF NOT EXISTS "mcb_claims" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "bp_amount" integer NOT NULL,
  "mcb_amount" numeric(36, 18) NOT NULL,
  "wallet_address" varchar(64) NOT NULL,
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "tx_hash" varchar(128),
  "reject_reason" text,
  "processed_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "mcb_claims_user_status_idx"
  ON "mcb_claims" ("user_id", "status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "mcb_claims_status_created_idx"
  ON "mcb_claims" ("status", "created_at" DESC);
