ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_identity_correction_status" varchar(16);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_identity_correction_requested_at" timestamptz;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_identity_correction_note" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_identity_proposed_first_name" varchar(128);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_identity_proposed_last_name" varchar(128);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_identity_corrected_at" timestamptz;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_identity_corrected_by" uuid;
