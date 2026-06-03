-- Academy Phase B — cohort chat, live room, tutor context

ALTER TABLE "academy_editions"
  ADD COLUMN IF NOT EXISTS "live_base_url" text;

ALTER TABLE "academy_editions"
  ADD COLUMN IF NOT EXISTS "tutor_enabled" boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "academy_cohort_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "edition_id" uuid NOT NULL REFERENCES "academy_editions"("id") ON DELETE CASCADE,
  "sender_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "body" text NOT NULL,
  "message_type" varchar(16) NOT NULL DEFAULT 'chat',
  "meta" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "academy_cohort_messages_edition_created_idx"
  ON "academy_cohort_messages" ("edition_id", "created_at");
