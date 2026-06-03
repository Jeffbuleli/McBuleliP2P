-- Infra backlog — optional R2 object key for session replays (VOD)

ALTER TABLE "academy_sessions"
  ADD COLUMN IF NOT EXISTS "replay_r2_key" varchar(256);
