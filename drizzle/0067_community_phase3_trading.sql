-- Phase 3 — signaux, copy-follow, réputation, badges
CREATE TABLE IF NOT EXISTS "community_trading_signals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "symbol" varchar(16) NOT NULL,
  "side" varchar(8) NOT NULL,
  "entry_price" numeric(36, 18),
  "target_price" numeric(36, 18),
  "stop_price" numeric(36, 18),
  "note" varchar(500) NOT NULL,
  "status" varchar(16) NOT NULL DEFAULT 'open',
  "outcome" varchar(16),
  "is_educational" boolean NOT NULL DEFAULT true,
  "published_at" timestamptz NOT NULL DEFAULT now(),
  "closed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "community_signals_author_idx" ON "community_trading_signals" ("author_id", "published_at");
CREATE INDEX IF NOT EXISTS "community_signals_status_idx" ON "community_trading_signals" ("status", "published_at");

CREATE TABLE IF NOT EXISTS "community_trader_follows" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "follower_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "trader_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "community_trader_follows_pair_unique"
  ON "community_trader_follows" ("follower_id", "trader_id");
CREATE INDEX IF NOT EXISTS "community_trader_follows_trader_idx" ON "community_trader_follows" ("trader_id", "created_at");

CREATE TABLE IF NOT EXISTS "community_reputation_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "delta" integer NOT NULL,
  "reason" varchar(48) NOT NULL,
  "ref_type" varchar(16),
  "ref_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "community_reputation_user_idx" ON "community_reputation_events" ("user_id", "created_at");

CREATE TABLE IF NOT EXISTS "community_badges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" varchar(32) NOT NULL UNIQUE,
  "label_fr" varchar(64) NOT NULL,
  "label_en" varchar(64) NOT NULL,
  "icon_key" varchar(16) NOT NULL DEFAULT 'star',
  "sort_order" integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "community_user_badges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "badge_id" uuid NOT NULL REFERENCES "community_badges"("id") ON DELETE CASCADE,
  "earned_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "community_user_badges_unique" ON "community_user_badges" ("user_id", "badge_id");
CREATE INDEX IF NOT EXISTS "community_user_badges_user_idx" ON "community_user_badges" ("user_id", "earned_at");

INSERT INTO "community_badges" ("slug", "label_fr", "label_en", "icon_key", "sort_order")
VALUES
  ('contributor', 'Contributeur', 'Contributor', 'star', 1),
  ('signal_pro', 'Signaleur', 'Signal provider', 'chart', 2),
  ('top_trader', 'Top trader', 'Top trader', 'trophy', 3),
  ('mentor', 'Mentor', 'Mentor', 'shield', 4)
ON CONFLICT ("slug") DO NOTHING;
