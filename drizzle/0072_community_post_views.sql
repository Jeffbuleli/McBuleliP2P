CREATE TABLE IF NOT EXISTS "community_post_views" (
  "post_id" uuid NOT NULL REFERENCES "community_posts"("id") ON DELETE CASCADE,
  "viewer_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("post_id", "viewer_id")
);

CREATE INDEX IF NOT EXISTS "community_post_views_post_idx"
ON "community_post_views" ("post_id", "created_at");
