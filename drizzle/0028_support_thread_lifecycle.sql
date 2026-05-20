ALTER TABLE "support_threads" ADD COLUMN IF NOT EXISTS "closed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "support_threads" ADD COLUMN IF NOT EXISTS "closed_reason" varchar(16);
--> statement-breakpoint
DROP INDEX IF EXISTS "support_threads_user_uq";
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "support_threads_user_status_idx" ON "support_threads" USING btree ("user_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "support_threads_user_open_uq" ON "support_threads" USING btree ("user_id") WHERE ("status" = 'open');
