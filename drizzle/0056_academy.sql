-- McBuleli Academy — Phase A (programs, editions, enrollments, attendance, quizzes, credentials)

ALTER TABLE "training_registrations"
  ADD COLUMN IF NOT EXISTS "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "training_registrations"
  ADD COLUMN IF NOT EXISTS "linked_at" timestamptz;

CREATE INDEX IF NOT EXISTS "training_registrations_user_idx"
  ON "training_registrations" ("user_id");

CREATE TABLE IF NOT EXISTS "academy_programs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(64) NOT NULL UNIQUE,
  "level" varchar(16) NOT NULL DEFAULT 'discovery',
  "price_usdt" numeric(36, 18),
  "title_fr" varchar(160) NOT NULL,
  "title_en" varchar(160) NOT NULL,
  "summary_fr" text,
  "summary_en" text,
  "topics" jsonb DEFAULT '[]'::jsonb,
  "requires_kyc" boolean NOT NULL DEFAULT false,
  "sort_order" integer NOT NULL DEFAULT 0,
  "published" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_editions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "program_id" uuid NOT NULL REFERENCES "academy_programs"("id") ON DELETE CASCADE,
  "slug" varchar(64) NOT NULL,
  "title_fr" varchar(160) NOT NULL,
  "title_en" varchar(160) NOT NULL,
  "delivery_mode" varchar(16) NOT NULL DEFAULT 'online',
  "status" varchar(16) NOT NULL DEFAULT 'draft',
  "starts_at" timestamptz,
  "ends_at" timestamptz,
  "cohort_meta" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "academy_editions_program_slug_unique" UNIQUE ("program_id", "slug")
);

CREATE INDEX IF NOT EXISTS "academy_editions_status_idx"
  ON "academy_editions" ("status", "starts_at");

CREATE TABLE IF NOT EXISTS "academy_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "edition_id" uuid NOT NULL REFERENCES "academy_editions"("id") ON DELETE CASCADE,
  "slug" varchar(64) NOT NULL,
  "title_fr" varchar(160) NOT NULL,
  "title_en" varchar(160) NOT NULL,
  "kind" varchar(16) NOT NULL DEFAULT 'live',
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz,
  "live_url" text,
  "sort_order" integer NOT NULL DEFAULT 0,
  CONSTRAINT "academy_sessions_edition_slug_unique" UNIQUE ("edition_id", "slug")
);

CREATE INDEX IF NOT EXISTS "academy_sessions_edition_starts_idx"
  ON "academy_sessions" ("edition_id", "starts_at");

CREATE TABLE IF NOT EXISTS "academy_enrollments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "edition_id" uuid NOT NULL REFERENCES "academy_editions"("id") ON DELETE CASCADE,
  "status" varchar(16) NOT NULL DEFAULT 'active',
  "paid_usdt" numeric(36, 18) NOT NULL DEFAULT '0',
  "payment_ref" varchar(64),
  "enrolled_at" timestamptz DEFAULT now() NOT NULL,
  "completed_at" timestamptz,
  CONSTRAINT "academy_enrollments_user_edition_unique" UNIQUE ("user_id", "edition_id")
);

CREATE INDEX IF NOT EXISTS "academy_enrollments_edition_idx"
  ON "academy_enrollments" ("edition_id");

CREATE TABLE IF NOT EXISTS "academy_attendance" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "enrollment_id" uuid NOT NULL REFERENCES "academy_enrollments"("id") ON DELETE CASCADE,
  "session_id" uuid NOT NULL REFERENCES "academy_sessions"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "method" varchar(16) NOT NULL DEFAULT 'live_button',
  "checked_in_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "academy_attendance_enrollment_session_unique" UNIQUE ("enrollment_id", "session_id")
);

CREATE TABLE IF NOT EXISTS "academy_quizzes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "edition_id" uuid NOT NULL REFERENCES "academy_editions"("id") ON DELETE CASCADE,
  "slug" varchar(64) NOT NULL,
  "title_fr" varchar(160) NOT NULL,
  "title_en" varchar(160) NOT NULL,
  "pass_percent" integer NOT NULL DEFAULT 70,
  "max_attempts" integer NOT NULL DEFAULT 3,
  CONSTRAINT "academy_quizzes_edition_slug_unique" UNIQUE ("edition_id", "slug")
);

CREATE TABLE IF NOT EXISTS "academy_quiz_questions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "quiz_id" uuid NOT NULL REFERENCES "academy_quizzes"("id") ON DELETE CASCADE,
  "sort_order" integer NOT NULL DEFAULT 0,
  "prompt_fr" text NOT NULL,
  "prompt_en" text NOT NULL,
  "options_fr" jsonb NOT NULL,
  "options_en" jsonb NOT NULL,
  "correct_index" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "academy_quiz_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "quiz_id" uuid NOT NULL REFERENCES "academy_quizzes"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "score_percent" integer NOT NULL,
  "passed" boolean NOT NULL,
  "answers" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "academy_quiz_attempts_user_quiz_idx"
  ON "academy_quiz_attempts" ("user_id", "quiz_id", "created_at" DESC);

CREATE TABLE IF NOT EXISTS "academy_credentials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "program_id" uuid REFERENCES "academy_programs"("id") ON DELETE SET NULL,
  "edition_id" uuid REFERENCES "academy_editions"("id") ON DELETE SET NULL,
  "kind" varchar(16) NOT NULL DEFAULT 'badge',
  "slug" varchar(64) NOT NULL,
  "title_fr" varchar(160) NOT NULL,
  "title_en" varchar(160) NOT NULL,
  "verify_code" varchar(32) NOT NULL UNIQUE,
  "issued_at" timestamptz DEFAULT now() NOT NULL,
  "revoked_at" timestamptz,
  "meta" jsonb
);

CREATE INDEX IF NOT EXISTS "academy_credentials_user_idx"
  ON "academy_credentials" ("user_id", "issued_at" DESC);
