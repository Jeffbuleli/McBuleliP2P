CREATE TABLE IF NOT EXISTS "jitsi_access_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "room" varchar(128) NOT NULL,
  "edition_id" uuid,
  "session_slug" varchar(64),
  "mode" varchar(16) NOT NULL,
  "moderator" boolean DEFAULT false NOT NULL,
  "ip_address" varchar(64),
  "user_agent" varchar(512),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "jitsi_access_log" ADD CONSTRAINT "jitsi_access_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jitsi_access_log_user_idx" ON "jitsi_access_log" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jitsi_access_log_room_idx" ON "jitsi_access_log" USING btree ("room");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jitsi_access_log_created_idx" ON "jitsi_access_log" USING btree ("created_at");
