ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country_code" varchar(8);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_status" varchar(16) NOT NULL DEFAULT 'none';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_updated_at" timestamp with time zone;

