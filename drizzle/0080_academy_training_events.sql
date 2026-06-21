-- Academy Events & Trainings (single source of truth)

CREATE TABLE IF NOT EXISTS "academy_training_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(128) NOT NULL UNIQUE,
  "title" varchar(200) NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "category" varchar(64) DEFAULT 'training' NOT NULL,
  "cover_image" text,
  "trainer_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "trainer_name" varchar(120) NOT NULL,
  "start_date" timestamptz NOT NULL,
  "end_date" timestamptz NOT NULL,
  "timezone" varchar(64) DEFAULT 'Africa/Kinshasa' NOT NULL,
  "duration_minutes" integer DEFAULT 60 NOT NULL,
  "location_type" varchar(16) DEFAULT 'ONLINE' NOT NULL,
  "live_room_id" varchar(128),
  "live_room_url" text,
  "max_participants" integer,
  "price" numeric(36, 18) DEFAULT '0' NOT NULL,
  "currency" varchar(16) DEFAULT 'USDT' NOT NULL,
  "event_type" varchar(8) DEFAULT 'FREE' NOT NULL,
  "visibility" varchar(16) DEFAULT 'COMMUNITY' NOT NULL,
  "audience_mode" varchar(32) DEFAULT 'MANUAL' NOT NULL,
  "status" varchar(16) DEFAULT 'DRAFT' NOT NULL,
  "community_post_id" uuid REFERENCES "community_posts"("id") ON DELETE SET NULL,
  "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "academy_training_events_status_start_idx"
  ON "academy_training_events" ("status", "start_date");
CREATE INDEX IF NOT EXISTS "academy_training_events_trainer_idx"
  ON "academy_training_events" ("trainer_id", "start_date");

CREATE TABLE IF NOT EXISTS "academy_training_event_participants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL REFERENCES "academy_training_events"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "participant_status" varchar(16) DEFAULT 'INVITED' NOT NULL,
  "payment_status" varchar(16) DEFAULT 'FREE' NOT NULL,
  "joined_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "academy_training_event_participants_event_user_uidx" UNIQUE ("event_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "academy_training_event_participants_user_idx"
  ON "academy_training_event_participants" ("user_id", "joined_at");

CREATE TABLE IF NOT EXISTS "academy_training_event_reminders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL REFERENCES "academy_training_events"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "reminder_kind" varchar(8) NOT NULL,
  "sent_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "academy_training_event_reminders_dedup_uidx" UNIQUE ("event_id", "user_id", "reminder_kind")
);
