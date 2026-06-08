-- Community Hub — fondations (métadonnées ; médias sur R2/Stream)
CREATE TABLE IF NOT EXISTS "community_user_profiles" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "handle" varchar(32) NOT NULL UNIQUE,
  "display_name" varchar(64) NOT NULL,
  "show_kyc_badge" boolean NOT NULL DEFAULT false,
  "bio" varchar(280),
  "avatar_media_id" uuid,
  "reputation_score" integer NOT NULL DEFAULT 0,
  "posts_count" integer NOT NULL DEFAULT 0,
  "meta" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "community_profiles_handle_idx" ON "community_user_profiles" ("handle");

CREATE TABLE IF NOT EXISTS "community_media" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "bucket" varchar(64) NOT NULL,
  "object_key" varchar(512) NOT NULL,
  "public_url" varchar(1024) NOT NULL,
  "file_type" varchar(16) NOT NULL,
  "mime_type" varchar(128) NOT NULL,
  "size_bytes" integer NOT NULL,
  "width" integer,
  "height" integer,
  "duration_sec" integer,
  "stream_id" varchar(64),
  "variants" jsonb,
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "community_media_owner_created_idx" ON "community_media" ("owner_id", "created_at");
CREATE INDEX IF NOT EXISTS "community_media_status_idx" ON "community_media" ("status", "created_at");

CREATE TABLE IF NOT EXISTS "community_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "post_type" varchar(16) NOT NULL DEFAULT 'text',
  "status" varchar(16) NOT NULL DEFAULT 'published',
  "media_ids" jsonb,
  "like_count" integer NOT NULL DEFAULT 0,
  "comment_count" integer NOT NULL DEFAULT 0,
  "share_count" integer NOT NULL DEFAULT 0,
  "published_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "community_posts_feed_idx" ON "community_posts" ("status", "published_at");
CREATE INDEX IF NOT EXISTS "community_posts_author_idx" ON "community_posts" ("author_id", "created_at");

CREATE TABLE IF NOT EXISTS "community_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "post_id" uuid NOT NULL REFERENCES "community_posts"("id") ON DELETE CASCADE,
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "parent_id" uuid,
  "body" text NOT NULL,
  "like_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "community_comments_post_idx" ON "community_comments" ("post_id", "created_at");
CREATE INDEX IF NOT EXISTS "community_comments_author_idx" ON "community_comments" ("author_id", "created_at");

CREATE TABLE IF NOT EXISTS "community_likes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "target_type" varchar(16) NOT NULL,
  "target_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "community_likes_target_idx" ON "community_likes" ("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "community_likes_user_target_idx" ON "community_likes" ("user_id", "target_type", "target_id");

CREATE TABLE IF NOT EXISTS "community_blog_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" varchar(32) NOT NULL UNIQUE,
  "label_fr" varchar(64) NOT NULL,
  "label_en" varchar(64) NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "community_blog_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "category_id" uuid REFERENCES "community_blog_categories"("id") ON DELETE SET NULL,
  "slug" varchar(120) NOT NULL UNIQUE,
  "title" varchar(200) NOT NULL,
  "excerpt" varchar(320),
  "body" text NOT NULL,
  "cover_media_id" uuid,
  "status" varchar(16) NOT NULL DEFAULT 'draft',
  "published_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "community_blog_posts_status_idx" ON "community_blog_posts" ("status", "published_at");
CREATE INDEX IF NOT EXISTS "community_blog_posts_author_idx" ON "community_blog_posts" ("author_id", "updated_at");
CREATE INDEX IF NOT EXISTS "community_blog_posts_category_idx" ON "community_blog_posts" ("category_id", "published_at");

CREATE TABLE IF NOT EXISTS "community_questions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" varchar(200) NOT NULL,
  "body" text NOT NULL,
  "tags" jsonb,
  "status" varchar(16) NOT NULL DEFAULT 'open',
  "accepted_answer_id" uuid,
  "view_count" integer NOT NULL DEFAULT 0,
  "answer_count" integer NOT NULL DEFAULT 0,
  "vote_score" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "community_questions_status_idx" ON "community_questions" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "community_questions_author_idx" ON "community_questions" ("author_id", "created_at");

CREATE TABLE IF NOT EXISTS "community_answers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "question_id" uuid NOT NULL REFERENCES "community_questions"("id") ON DELETE CASCADE,
  "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "vote_score" integer NOT NULL DEFAULT 0,
  "is_accepted" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "community_answers_question_idx" ON "community_answers" ("question_id", "vote_score", "created_at");
CREATE INDEX IF NOT EXISTS "community_answers_author_idx" ON "community_answers" ("author_id", "created_at");

CREATE TABLE IF NOT EXISTS "community_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "reporter_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "target_type" varchar(16) NOT NULL,
  "target_id" uuid NOT NULL,
  "reason" varchar(32) NOT NULL,
  "details" text,
  "status" varchar(16) NOT NULL DEFAULT 'open',
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "community_reports_status_idx" ON "community_reports" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "community_reports_target_idx" ON "community_reports" ("target_type", "target_id");

CREATE TABLE IF NOT EXISTS "community_user_blocks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "blocker_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "blocked_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "community_blocks_blocker_idx" ON "community_user_blocks" ("blocker_id", "created_at");
CREATE INDEX IF NOT EXISTS "community_blocks_pair_idx" ON "community_user_blocks" ("blocker_id", "blocked_id");

-- Catégories blog initiales
INSERT INTO "community_blog_categories" ("slug", "label_fr", "label_en", "sort_order")
VALUES
  ('crypto', 'Crypto', 'Crypto', 1),
  ('trading', 'Trading', 'Trading', 2),
  ('blockchain', 'Blockchain', 'Blockchain', 3),
  ('p2p', 'P2P', 'P2P', 4),
  ('finance', 'Finance', 'Finance', 5),
  ('ia', 'IA', 'AI', 6),
  ('avec', 'AVEC', 'AVEC', 7)
ON CONFLICT ("slug") DO NOTHING;
