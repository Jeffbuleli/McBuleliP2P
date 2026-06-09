ALTER TABLE "community_posts"
ADD COLUMN IF NOT EXISTS "view_count" integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "community_posts_trending_idx"
ON "community_posts" ("status", "published_at", "like_count", "comment_count", "view_count");
