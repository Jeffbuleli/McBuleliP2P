-- Academy Phase C — replays, learning events, session reminders

ALTER TABLE "academy_sessions"
  ADD COLUMN IF NOT EXISTS "replay_url" text;

ALTER TABLE "academy_sessions"
  ADD COLUMN IF NOT EXISTS "replay_published_at" timestamptz;

/** xAPI-lite / analytics internes */
CREATE TABLE IF NOT EXISTS "academy_learning_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "edition_id" uuid REFERENCES "academy_editions"("id") ON DELETE SET NULL,
  "verb" varchar(32) NOT NULL,
  "object_type" varchar(32) NOT NULL,
  "object_id" varchar(64),
  "meta" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "academy_learning_events_user_created_idx"
  ON "academy_learning_events" ("user_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "academy_learning_events_edition_idx"
  ON "academy_learning_events" ("edition_id", "created_at" DESC);

/** Dedupe rappels (notif in-app + email optionnel) */
CREATE TABLE IF NOT EXISTS "academy_session_reminders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "academy_sessions"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "reminder_kind" varchar(16) NOT NULL,
  "sent_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "academy_session_reminders_unique" UNIQUE ("session_id", "user_id", "reminder_kind")
);

CREATE INDEX IF NOT EXISTS "academy_session_reminders_session_idx"
  ON "academy_session_reminders" ("session_id");
