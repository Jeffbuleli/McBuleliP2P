CREATE TABLE IF NOT EXISTS "community_translation_cache" (
  "content_hash" varchar(64) NOT NULL,
  "target_locale" varchar(8) NOT NULL,
  "source_locale" varchar(8),
  "translated_text" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("content_hash", "target_locale")
);
