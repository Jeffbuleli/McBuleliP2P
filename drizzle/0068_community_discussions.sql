-- UX refactor — discussions forum
CREATE TABLE IF NOT EXISTS "community_discussion_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" varchar(32) NOT NULL UNIQUE,
  "label_fr" varchar(64) NOT NULL,
  "label_en" varchar(64) NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "community_discussions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "category_id" uuid REFERENCES "community_discussion_categories"("id") ON DELETE SET NULL,
  "title" varchar(200) NOT NULL,
  "body" text NOT NULL,
  "reply_count" integer NOT NULL DEFAULT 0,
  "follow_count" integer NOT NULL DEFAULT 0,
  "last_activity_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "community_discussions_activity_idx" ON "community_discussions" ("last_activity_at");
CREATE INDEX IF NOT EXISTS "community_discussions_category_idx" ON "community_discussions" ("category_id", "last_activity_at");
CREATE INDEX IF NOT EXISTS "community_discussions_author_idx" ON "community_discussions" ("author_id", "created_at");

CREATE TABLE IF NOT EXISTS "community_discussion_replies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "discussion_id" uuid NOT NULL REFERENCES "community_discussions"("id") ON DELETE CASCADE,
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "community_discussion_replies_disc_idx" ON "community_discussion_replies" ("discussion_id", "created_at");

CREATE TABLE IF NOT EXISTS "community_discussion_follows" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "discussion_id" uuid NOT NULL REFERENCES "community_discussions"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "community_discussion_follows_unique"
  ON "community_discussion_follows" ("user_id", "discussion_id");
CREATE INDEX IF NOT EXISTS "community_discussion_follows_user_idx" ON "community_discussion_follows" ("user_id", "created_at");

INSERT INTO "community_discussion_categories" ("slug", "label_fr", "label_en", "sort_order")
VALUES
  ('general', 'Général', 'General', 1),
  ('crypto', 'Crypto', 'Crypto', 2),
  ('trading', 'Trading', 'Trading', 3),
  ('p2p', 'P2P', 'P2P', 4),
  ('tech', 'Tech & IA', 'Tech & AI', 5)
ON CONFLICT ("slug") DO NOTHING;
