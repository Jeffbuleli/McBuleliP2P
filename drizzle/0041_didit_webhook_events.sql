CREATE TABLE IF NOT EXISTS "didit_webhook_events" (
  "event_id" varchar(64) PRIMARY KEY NOT NULL,
  "processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
