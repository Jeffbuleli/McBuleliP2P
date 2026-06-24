ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "anti_phishing_code_hash" varchar(255);

CREATE TABLE IF NOT EXISTS "user_login_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "method" varchar(16) NOT NULL,
  "ip_address" varchar(64),
  "user_agent" text,
  "device_label" varchar(128),
  "success" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "user_login_events_user_created_idx"
  ON "user_login_events" ("user_id", "created_at" DESC);
