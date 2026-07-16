-- McBuleli Builders Program (MBP) — paid tiers in McB (not BP)
CREATE TABLE IF NOT EXISTS "builders_memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tier" varchar(16) NOT NULL,
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "paid_mcb" numeric(36, 18) NOT NULL,
  "payment_kind" varchar(24) NOT NULL DEFAULT 'onchain_tx',
  "wallet_address" varchar(64),
  "tx_hash" varchar(128),
  "reject_reason" text,
  "starts_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "processed_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "processed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "builders_memberships_user_status_idx"
  ON "builders_memberships" ("user_id", "status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "builders_memberships_status_created_idx"
  ON "builders_memberships" ("status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "builders_memberships_tier_idx"
  ON "builders_memberships" ("tier", "status");
