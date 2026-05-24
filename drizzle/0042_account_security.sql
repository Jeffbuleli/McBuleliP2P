ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pending_email" varchar(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_version" integer NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_secret_enc" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_enabled_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "recovery_wa_chat_id" varchar(64);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "recovery_wa_phone" varchar(32);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wa_verified_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kyc_portrait_url" text;

UPDATE "users" SET "email_verified_at" = COALESCE("email_verified_at", "created_at")
WHERE "email_verified_at" IS NULL;

CREATE TABLE IF NOT EXISTS "auth_challenges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
  "purpose" varchar(32) NOT NULL,
  "code_hash" varchar(128) NOT NULL,
  "meta" jsonb,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "auth_challenges_user_purpose_idx"
  ON "auth_challenges" ("user_id", "purpose");
CREATE INDEX IF NOT EXISTS "auth_challenges_expires_idx"
  ON "auth_challenges" ("expires_at");

CREATE TABLE IF NOT EXISTS "user_totp_backup_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code_hash" varchar(128) NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "user_totp_backup_codes_user_idx" ON "user_totp_backup_codes" ("user_id");

CREATE TABLE IF NOT EXISTS "user_passkeys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "credential_id" text NOT NULL,
  "public_key" text NOT NULL,
  "counter" bigint NOT NULL DEFAULT 0,
  "device_name" varchar(64),
  "transports" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_used_at" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_passkeys_credential_id_unique"
  ON "user_passkeys" ("credential_id");
CREATE INDEX IF NOT EXISTS "user_passkeys_user_idx" ON "user_passkeys" ("user_id");

CREATE TABLE IF NOT EXISTS "wa_inbound_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chat_id" varchar(64),
  "phone" varchar(32),
  "body" text,
  "matched_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "matched_challenge_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "wa_inbound_events_created_idx" ON "wa_inbound_events" ("created_at");
