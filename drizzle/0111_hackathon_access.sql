-- Hackathon door access: partner badges + presence + multi-day scan log
ALTER TABLE "hackathon_partners"
  ADD COLUMN IF NOT EXISTS "ticket_code" varchar(32),
  ADD COLUMN IF NOT EXISTS "presence_status" varchar(16) NOT NULL DEFAULT 'absent',
  ADD COLUMN IF NOT EXISTS "checked_in_at" timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS "hackathon_partners_ticket_code_uidx"
  ON "hackathon_partners" ("ticket_code")
  WHERE "ticket_code" IS NOT NULL;

ALTER TABLE "hackathon_registrations"
  ADD COLUMN IF NOT EXISTS "presence_status" varchar(16) NOT NULL DEFAULT 'absent';

CREATE TABLE IF NOT EXISTS "hackathon_access_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "edition_id" uuid NOT NULL REFERENCES "hackathon_editions"("id") ON DELETE CASCADE,
  "subject_type" varchar(16) NOT NULL,
  "subject_id" uuid NOT NULL,
  "ticket_code" varchar(32) NOT NULL,
  "day_index" smallint NOT NULL,
  "event_type" varchar(8) NOT NULL,
  "scanned_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "scanned_at" timestamptz DEFAULT now() NOT NULL,
  "note" text
);

CREATE INDEX IF NOT EXISTS "hackathon_access_events_edition_day_idx"
  ON "hackathon_access_events" ("edition_id", "day_index", "scanned_at");
CREATE INDEX IF NOT EXISTS "hackathon_access_events_ticket_idx"
  ON "hackathon_access_events" ("ticket_code", "scanned_at");
CREATE INDEX IF NOT EXISTS "hackathon_access_events_subject_idx"
  ON "hackathon_access_events" ("subject_type", "subject_id", "day_index");
