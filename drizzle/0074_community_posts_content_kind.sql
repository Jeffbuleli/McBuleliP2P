ALTER TABLE "community_posts"
ADD COLUMN IF NOT EXISTS "content_kind" varchar(16) NOT NULL DEFAULT 'news';

CREATE INDEX IF NOT EXISTS "community_posts_content_kind_idx"
ON "community_posts" ("content_kind", "published_at");
