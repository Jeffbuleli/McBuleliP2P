ALTER TABLE "group_savings_groups" ADD COLUMN IF NOT EXISTS "logo_url" text;
--> statement-breakpoint
ALTER TABLE "group_savings_groups" ADD COLUMN IF NOT EXISTS "address" text;
--> statement-breakpoint
ALTER TABLE "group_savings_groups" ADD COLUMN IF NOT EXISTS "contact_phone" varchar(32);
--> statement-breakpoint
ALTER TABLE "group_savings_groups" ADD COLUMN IF NOT EXISTS "contact_email" varchar(128);
--> statement-breakpoint
ALTER TABLE "group_savings_groups" ADD COLUMN IF NOT EXISTS "public_description" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"message_type" varchar(16) DEFAULT 'chat' NOT NULL,
	"attachment_url" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_group_id_group_savings_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group_savings_groups"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_messages_group_created_idx" ON "group_messages" USING btree ("group_id","created_at");
