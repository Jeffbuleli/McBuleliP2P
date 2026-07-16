-- SUG Horizon B1: ads schema (flagged off until McB BSC launch)
CREATE TABLE IF NOT EXISTS "community_brands" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "legal_name" varchar(160) NOT NULL,
  "display_name" varchar(80) NOT NULL,
  "kyc_status" varchar(24) NOT NULL DEFAULT 'pending',
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "billing_wallet" varchar(64),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "community_brands_owner_idx"
  ON "community_brands" ("owner_user_id", "status");

CREATE TABLE IF NOT EXISTS "community_ad_products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(32) NOT NULL UNIQUE,
  "kind" varchar(24) NOT NULL,
  "price_mcb" numeric(36, 18) NOT NULL,
  "duration_hours" integer,
  "active" boolean NOT NULL DEFAULT true,
  "meta" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "community_ad_campaigns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "brand_id" uuid NOT NULL REFERENCES "community_brands"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "community_ad_products"("id"),
  "status" varchar(16) NOT NULL DEFAULT 'draft',
  "creative_body" text,
  "creative_media_id" uuid,
  "landing_url" text,
  "targeting" jsonb,
  "budget_mcb" numeric(36, 18) NOT NULL,
  "spent_mcb" numeric(36, 18) NOT NULL DEFAULT '0',
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "community_ad_campaigns_status_idx"
  ON "community_ad_campaigns" ("status", "starts_at", "ends_at");

CREATE INDEX IF NOT EXISTS "community_ad_campaigns_brand_idx"
  ON "community_ad_campaigns" ("brand_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "community_ad_impressions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "campaign_id" uuid NOT NULL REFERENCES "community_ad_campaigns"("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "post_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "community_ad_impressions_campaign_idx"
  ON "community_ad_impressions" ("campaign_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "community_creator_fund_months" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "month_key" varchar(7) NOT NULL UNIQUE,
  "total_mcb" numeric(36, 18) NOT NULL DEFAULT '0',
  "status" varchar(16) NOT NULL DEFAULT 'open',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "community_creator_fund_payouts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "month_key" varchar(7) NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "mcb_amount" numeric(36, 18) NOT NULL DEFAULT '0',
  "usdt_amount" numeric(36, 18) NOT NULL DEFAULT '0',
  "tx_ref" varchar(128),
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "community_creator_fund_payouts_month_idx"
  ON "community_creator_fund_payouts" ("month_key", "user_id");

INSERT INTO "community_ad_products" ("code", "kind", "price_mcb", "duration_hours", "active")
VALUES
  ('ad_boost_mcb', 'boost', '50', 24, true),
  ('ad_feed_brand', 'feed', '200', 168, true),
  ('ad_live_sponsor', 'live', '500', NULL, true),
  ('ad_job_local', 'job', '120', 336, true)
ON CONFLICT ("code") DO NOTHING;
