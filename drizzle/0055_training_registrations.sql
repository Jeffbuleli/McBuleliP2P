CREATE TABLE IF NOT EXISTS "training_registrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "full_name" varchar(120) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(32) NOT NULL,
  "city" varchar(80),
  "locale" varchar(8) DEFAULT 'fr' NOT NULL,
  "experience_level" varchar(24),
  "interests" jsonb DEFAULT '[]'::jsonb,
  "whatsapp_opt_in" boolean DEFAULT true NOT NULL,
  "source" varchar(64) DEFAULT 'formation' NOT NULL,
  "utm_source" varchar(64),
  "utm_medium" varchar(32),
  "utm_campaign" varchar(64),
  "reminded_at" timestamptz,
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "training_registrations_created_idx"
  ON "training_registrations" ("created_at" DESC);

CREATE INDEX IF NOT EXISTS "training_registrations_email_idx"
  ON "training_registrations" ("email");
