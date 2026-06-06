ALTER TABLE "academy_sessions"
  ADD COLUMN IF NOT EXISTS "live_started_at" timestamp with time zone;
