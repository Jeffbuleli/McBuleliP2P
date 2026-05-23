ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "metamap_identity_id" varchar(128);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "metamap_verification_id" varchar(128);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_rejection_note" text;
