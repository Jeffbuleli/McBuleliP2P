-- SUG Horizon A: utility tags + quality score on community posts
ALTER TABLE "community_posts"
  ADD COLUMN IF NOT EXISTS "utility_tag" varchar(16) NOT NULL DEFAULT 'create';
ALTER TABLE "community_posts"
  ADD COLUMN IF NOT EXISTS "quality_score" smallint NOT NULL DEFAULT 50;
ALTER TABLE "community_posts"
  ADD COLUMN IF NOT EXISTS "quality_source" varchar(16) NOT NULL DEFAULT 'rules';

UPDATE "community_posts"
SET "utility_tag" = CASE "content_kind"
  WHEN 'news' THEN 'local'
  WHEN 'discussion' THEN 'create'
  WHEN 'analysis' THEN 'trade_edu'
  WHEN 'experience' THEN 'p2p'
  WHEN 'formation' THEN 'learn'
  ELSE 'create'
END
WHERE "utility_tag" = 'create';

CREATE INDEX IF NOT EXISTS "community_posts_utility_tag_idx"
  ON "community_posts" ("utility_tag", "published_at");

CREATE INDEX IF NOT EXISTS "community_posts_quality_score_idx"
  ON "community_posts" ("quality_score", "published_at");
