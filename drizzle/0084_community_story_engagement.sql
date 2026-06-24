-- Story views & emoji reactions (24h statuses)
CREATE TABLE IF NOT EXISTS "community_story_views" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "story_id" uuid NOT NULL REFERENCES "community_stories"("id") ON DELETE CASCADE,
  "viewer_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "community_story_views_unique" UNIQUE("story_id", "viewer_id")
);

CREATE TABLE IF NOT EXISTS "community_story_reactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "story_id" uuid NOT NULL REFERENCES "community_stories"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "emoji" varchar(16) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "community_story_reactions_unique" UNIQUE("story_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "community_story_views_story_idx"
  ON "community_story_views" ("story_id");

CREATE INDEX IF NOT EXISTS "community_story_reactions_story_idx"
  ON "community_story_reactions" ("story_id");
