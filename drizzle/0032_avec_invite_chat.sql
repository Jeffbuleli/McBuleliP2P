ALTER TABLE "group_savings_groups" ADD COLUMN IF NOT EXISTS "invite_code" varchar(16);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "group_savings_groups_invite_code_uidx" ON "group_savings_groups" ("invite_code") WHERE "invite_code" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "group_messages" ADD COLUMN IF NOT EXISTS "attachment_expires_at" timestamp with time zone;
