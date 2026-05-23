ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "didit_session_status" varchar(32);
ALTER TABLE "users" DROP COLUMN IF EXISTS "metamap_identity_id";
ALTER TABLE "users" DROP COLUMN IF EXISTS "metamap_verification_id";
