-- Fix: apply profile columns + DM tables as separate statements (Render-safe)

ALTER TABLE "community_user_profiles" ADD COLUMN IF NOT EXISTS "cover_media_id" uuid;
--> statement-breakpoint
ALTER TABLE "community_user_profiles" ADD COLUMN IF NOT EXISTS "verified_blue" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "community_user_profiles" ADD COLUMN IF NOT EXISTS "last_active_at" timestamptz;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_dm_threads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "participant_a" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "participant_b" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "requested_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "last_message_at" timestamptz NOT NULL DEFAULT now(),
  "last_message_preview" varchar(160),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "community_dm_threads_pair_order" CHECK ("participant_a" < "participant_b")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "community_dm_threads_pair_unique"
  ON "community_dm_threads" ("participant_a", "participant_b");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_dm_threads_last_msg_idx"
  ON "community_dm_threads" ("last_message_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_dm_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "thread_id" uuid NOT NULL REFERENCES "community_dm_threads"("id") ON DELETE CASCADE,
  "sender_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "body" text NOT NULL DEFAULT '',
  "message_type" varchar(16) NOT NULL DEFAULT 'text',
  "attachment_url" text,
  "attachment_meta" jsonb,
  "hidden" boolean NOT NULL DEFAULT false,
  "hidden_reason" varchar(32),
  "delivered_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_dm_messages_thread_created_idx"
  ON "community_dm_messages" ("thread_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_dm_reads" (
  "thread_id" uuid NOT NULL REFERENCES "community_dm_threads"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "last_read_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("thread_id", "user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_dm_mutes" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "muted_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "until_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "muted_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_dm_typing" (
  "thread_id" uuid NOT NULL REFERENCES "community_dm_threads"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires_at" timestamptz NOT NULL,
  PRIMARY KEY ("thread_id", "user_id")
);
