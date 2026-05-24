ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "legal_first_name" varchar(128);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "legal_last_name" varchar(128);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birth_date" date;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "document_number" varchar(64);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "document_type" varchar(32);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "document_country" varchar(8);

CREATE TABLE IF NOT EXISTS "kyc_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "didit_session_id" varchar(128) NOT NULL,
  "status" varchar(32) NOT NULL DEFAULT 'Not Started',
  "workflow_id" varchar(64),
  "verification_url" text,
  "raw_decision" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "kyc_sessions_didit_session_id_unique"
  ON "kyc_sessions" ("didit_session_id");
CREATE INDEX IF NOT EXISTS "kyc_sessions_user_id_idx" ON "kyc_sessions" ("user_id");

CREATE TABLE IF NOT EXISTS "kyc_results" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "kyc_sessions"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "outcome" varchar(16) NOT NULL,
  "first_name" varchar(128),
  "last_name" varchar(128),
  "birth_date" date,
  "document_number" varchar(64),
  "document_type" varchar(32),
  "document_country" varchar(8),
  "rejection_reason" text,
  "source" varchar(16) NOT NULL DEFAULT 'webhook',
  "decided_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "kyc_results_user_id_idx" ON "kyc_results" ("user_id");
