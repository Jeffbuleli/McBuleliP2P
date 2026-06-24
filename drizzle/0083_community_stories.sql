-- Community status/stories (24h expiry, R2 media)
CREATE TABLE IF NOT EXISTS "community_stories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "story_type" varchar(16) NOT NULL,
  "body" text,
  "media_id" uuid REFERENCES "community_media"("id") ON DELETE SET NULL,
  "media_url" text,
  "bg_color" varchar(32),
  "status" varchar(16) NOT NULL DEFAULT 'active',
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "community_stories_author_expires_idx"
  ON "community_stories" ("author_id", "expires_at");

CREATE INDEX IF NOT EXISTS "community_stories_feed_idx"
  ON "community_stories" ("status", "expires_at");
