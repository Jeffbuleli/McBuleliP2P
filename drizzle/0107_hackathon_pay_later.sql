-- Hackathon pay-later: seat hold + magic payment token
ALTER TABLE "hackathon_registrations"
  ADD COLUMN IF NOT EXISTS "payment_token" varchar(64);
ALTER TABLE "hackathon_registrations"
  ADD COLUMN IF NOT EXISTS "hold_expires_at" timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS "hackathon_registrations_payment_token_uidx"
  ON "hackathon_registrations" ("payment_token")
  WHERE "payment_token" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "hackathon_registrations_hold_idx"
  ON "hackathon_registrations" ("hold_expires_at");
