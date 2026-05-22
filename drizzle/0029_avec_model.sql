ALTER TABLE "group_savings_groups" ADD COLUMN IF NOT EXISTS "max_shares_per_meeting" integer DEFAULT 5 NOT NULL;
--> statement-breakpoint
ALTER TABLE "group_savings_groups" ADD COLUMN IF NOT EXISTS "meeting_interval_days" integer DEFAULT 7 NOT NULL;
--> statement-breakpoint
ALTER TABLE "group_savings_groups" ADD COLUMN IF NOT EXISTS "social_fund_usdt" numeric(36, 18) DEFAULT '0' NOT NULL;
