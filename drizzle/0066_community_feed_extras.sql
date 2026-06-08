-- Phase 1b — fil d'actualité (likes uniques, URLs médias longues)
ALTER TABLE "community_media"
  ALTER COLUMN "public_url" TYPE text;

CREATE UNIQUE INDEX IF NOT EXISTS "community_likes_user_target_unique"
  ON "community_likes" ("user_id", "target_type", "target_id");
