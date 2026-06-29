-- Idempotent patch: users columns added after initial local db:push.
-- Safe to re-run (IF NOT EXISTS). Run: psql "$DATABASE_URL" -f scripts/patch-users-missing-columns.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_identity_correction_status varchar(16);
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_identity_correction_requested_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_identity_correction_note text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_identity_proposed_first_name varchar(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_identity_proposed_last_name varchar(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_identity_corrected_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_identity_corrected_by uuid;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trade_live_disabled_reason text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trade_live_disabled_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS anti_phishing_code_hash varchar(255);
