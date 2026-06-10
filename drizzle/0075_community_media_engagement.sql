ALTER TABLE "community_media"
ADD COLUMN IF NOT EXISTS "like_count" integer NOT NULL DEFAULT 0;

ALTER TABLE "community_media"
ADD COLUMN IF NOT EXISTS "comment_count" integer NOT NULL DEFAULT 0;

ALTER TABLE "community_media"
ADD COLUMN IF NOT EXISTS "share_count" integer NOT NULL DEFAULT 0;

ALTER TABLE "community_comments"
ADD COLUMN IF NOT EXISTS "media_id" uuid REFERENCES "community_media"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "community_comments_media_idx"
ON "community_comments" ("media_id", "created_at");
