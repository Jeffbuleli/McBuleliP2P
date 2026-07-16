-- Ambassadeur charter applications (Gold+ Builders + KYC + signed charter)
CREATE TABLE IF NOT EXISTS "ambassador_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "region" varchar(120) NOT NULL,
  "motivation" text NOT NULL,
  "experience" text,
  "languages" varchar(120),
  "charter_version" varchar(16) NOT NULL,
  "charter_accepted_at" timestamp with time zone NOT NULL,
  "builder_tier_at_apply" varchar(16) NOT NULL,
  "reject_reason" text,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "processed_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "processed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ambassador_applications_user_status_idx"
  ON "ambassador_applications" ("user_id", "status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "ambassador_applications_status_created_idx"
  ON "ambassador_applications" ("status", "created_at" DESC);
