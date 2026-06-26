CREATE TABLE IF NOT EXISTS "financial_audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "action" varchar(64) NOT NULL,
  "resource_type" varchar(32),
  "resource_id" varchar(64),
  "asset" varchar(16),
  "amount" numeric(36, 18),
  "ip_address" varchar(64),
  "user_agent" varchar(512),
  "meta" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "financial_audit_log" ADD CONSTRAINT "financial_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_audit_log_user_idx" ON "financial_audit_log" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_audit_log_created_idx" ON "financial_audit_log" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_audit_log_action_idx" ON "financial_audit_log" USING btree ("action");
