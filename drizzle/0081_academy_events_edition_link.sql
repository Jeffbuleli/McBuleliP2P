ALTER TABLE "academy_training_events"
  ADD COLUMN IF NOT EXISTS "edition_id" uuid REFERENCES "academy_editions"("id") ON DELETE SET NULL;

ALTER TABLE "academy_training_events"
  ADD COLUMN IF NOT EXISTS "legacy_session_id" uuid REFERENCES "academy_sessions"("id") ON DELETE SET NULL;

ALTER TABLE "academy_training_events"
  ADD COLUMN IF NOT EXISTS "sort_order" integer NOT NULL DEFAULT 0;

ALTER TABLE "academy_training_events"
  ADD COLUMN IF NOT EXISTS "replay_r2_key" varchar(256);

ALTER TABLE "academy_training_events"
  ADD COLUMN IF NOT EXISTS "live_started_at" timestamptz;

CREATE INDEX IF NOT EXISTS "academy_training_events_edition_start_idx"
  ON "academy_training_events" ("edition_id", "start_date");

CREATE UNIQUE INDEX IF NOT EXISTS "academy_training_events_legacy_session_uidx"
  ON "academy_training_events" ("legacy_session_id")
  WHERE "legacy_session_id" IS NOT NULL;
