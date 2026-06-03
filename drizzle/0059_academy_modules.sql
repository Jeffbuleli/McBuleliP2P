-- McBuleli Academy Phase P2 — micro-modules + progress nudges (P1b)

CREATE TABLE IF NOT EXISTS "academy_modules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "edition_id" uuid NOT NULL REFERENCES "academy_editions"("id") ON DELETE CASCADE,
  "slug" varchar(64) NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "title_fr" varchar(160) NOT NULL,
  "title_en" varchar(160) NOT NULL,
  "summary_fr" text NOT NULL,
  "summary_en" text NOT NULL,
  "body_fr" text NOT NULL,
  "body_en" text NOT NULL,
  "visual_key" varchar(16) NOT NULL DEFAULT 'crypto',
  "unlock_after_slug" varchar(64),
  "ecosystem_href" varchar(256),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "academy_modules_edition_slug_unique" UNIQUE ("edition_id", "slug")
);

CREATE INDEX IF NOT EXISTS "academy_modules_edition_sort_idx"
  ON "academy_modules" ("edition_id", "sort_order");

CREATE TABLE IF NOT EXISTS "academy_module_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "module_id" uuid NOT NULL REFERENCES "academy_modules"("id") ON DELETE CASCADE,
  "completed_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "academy_module_progress_user_module_unique" UNIQUE ("user_id", "module_id")
);

CREATE INDEX IF NOT EXISTS "academy_module_progress_user_idx"
  ON "academy_module_progress" ("user_id");

CREATE TABLE IF NOT EXISTS "academy_progress_nudges" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "last_sent_at" timestamptz NOT NULL
);
