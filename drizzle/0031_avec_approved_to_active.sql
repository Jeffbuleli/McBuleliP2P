UPDATE "group_savings_groups" SET "status" = 'active' WHERE "status" = 'approved';
--> statement-breakpoint
UPDATE "group_savings_groups" SET "subscription_status" = 'active' WHERE "status" = 'active' AND "subscription_status" = 'overdue' AND "reviewed_at" IS NOT NULL;
