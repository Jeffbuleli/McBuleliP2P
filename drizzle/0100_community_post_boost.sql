-- SUG Horizon A4: post boost (BP spend, 24h)
ALTER TABLE "community_posts"
  ADD COLUMN IF NOT EXISTS "boosted_until" timestamp with time zone;
ALTER TABLE "community_posts"
  ADD COLUMN IF NOT EXISTS "boost_bp_spent" integer;

CREATE INDEX IF NOT EXISTS "community_posts_boosted_until_idx"
  ON "community_posts" ("boosted_until")
  WHERE "boosted_until" IS NOT NULL;
