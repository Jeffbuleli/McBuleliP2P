CREATE TABLE IF NOT EXISTS "partner_meets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(128) NOT NULL,
  "title" varchar(200) NOT NULL,
  "partner_name" varchar(160) NOT NULL,
  "partner_email" varchar(255) NOT NULL,
  "host_email" varchar(255) NOT NULL,
  "scheduled_at" timestamp with time zone,
  "duration_minutes" integer DEFAULT 30 NOT NULL,
  "room_slug" varchar(128) NOT NULL,
  "status" varchar(16) DEFAULT 'proposed' NOT NULL,
  "agenda" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "allowlist_emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "timezone" varchar(64) DEFAULT 'Africa/Kinshasa' NOT NULL,
  "notes" text,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "partner_meets" ADD CONSTRAINT "partner_meets_created_by_users_id_fk"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "partner_meets_slug_uidx" ON "partner_meets" USING btree ("slug");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "partner_meets_room_slug_uidx" ON "partner_meets" USING btree ("room_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_meets_status_idx" ON "partner_meets" USING btree ("status");
