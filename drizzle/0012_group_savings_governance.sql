CREATE TABLE "group_savings_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(16) NOT NULL,
	"name" varchar(96) NOT NULL,
	"country_code" varchar(8),
	"min_members" integer DEFAULT 2 NOT NULL,
	"max_members" integer DEFAULT 30 NOT NULL,
	"contribution_amount_usdt" numeric(36, 18) NOT NULL,
	"cycle_duration_days" integer NOT NULL,
	"payment_rules" text,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"subscription_status" varchar(16) DEFAULT 'overdue' NOT NULL,
	"next_billing_at" timestamp with time zone,
	"created_by_user_id" uuid NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_savings_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(16) DEFAULT 'member' NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"approved_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_wallet_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"entry_type" varchar(32) NOT NULL,
	"asset" varchar(16) DEFAULT 'USDT' NOT NULL,
	"amount" numeric(36, 18) NOT NULL,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_subscription_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"period" varchar(7) NOT NULL,
	"amount_usdt" numeric(36, 18) DEFAULT '5' NOT NULL,
	"status" varchar(16) NOT NULL,
	"attempted_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"failure_reason" text,
	"ledger_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(64) NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_savings_groups" ADD CONSTRAINT "group_savings_groups_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_savings_groups" ADD CONSTRAINT "group_savings_groups_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_savings_memberships" ADD CONSTRAINT "group_savings_memberships_group_id_group_savings_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group_savings_groups"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_savings_memberships" ADD CONSTRAINT "group_savings_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_savings_memberships" ADD CONSTRAINT "group_savings_memberships_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_wallet_ledger_entries" ADD CONSTRAINT "group_wallet_ledger_entries_group_id_group_savings_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group_savings_groups"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_subscription_invoices" ADD CONSTRAINT "group_subscription_invoices_group_id_group_savings_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group_savings_groups"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_subscription_invoices" ADD CONSTRAINT "group_subscription_invoices_ledger_entry_id_group_wallet_ledger_entries_id_fk" FOREIGN KEY ("ledger_entry_id") REFERENCES "public"."group_wallet_ledger_entries"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_audit_log" ADD CONSTRAINT "group_audit_log_group_id_group_savings_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group_savings_groups"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "group_audit_log" ADD CONSTRAINT "group_audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "group_savings_groups_creator_idx" ON "group_savings_groups" USING btree ("created_by_user_id");
--> statement-breakpoint
CREATE INDEX "group_savings_groups_status_idx" ON "group_savings_groups" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "group_savings_groups_next_billing_idx" ON "group_savings_groups" USING btree ("next_billing_at");
--> statement-breakpoint
CREATE INDEX "group_savings_memberships_group_idx" ON "group_savings_memberships" USING btree ("group_id");
--> statement-breakpoint
CREATE INDEX "group_savings_memberships_user_idx" ON "group_savings_memberships" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "group_savings_memberships_group_user_uidx" ON "group_savings_memberships" USING btree ("group_id","user_id");
--> statement-breakpoint
CREATE INDEX "group_wallet_ledger_group_idx" ON "group_wallet_ledger_entries" USING btree ("group_id");
--> statement-breakpoint
CREATE INDEX "group_wallet_ledger_batch_idx" ON "group_wallet_ledger_entries" USING btree ("batch_id");
--> statement-breakpoint
CREATE INDEX "group_wallet_ledger_created_idx" ON "group_wallet_ledger_entries" USING btree ("created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "group_subscription_invoices_group_period_uidx" ON "group_subscription_invoices" USING btree ("group_id","period");
--> statement-breakpoint
CREATE INDEX "group_subscription_invoices_status_idx" ON "group_subscription_invoices" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "group_audit_log_group_idx" ON "group_audit_log" USING btree ("group_id");
--> statement-breakpoint
CREATE INDEX "group_audit_log_created_idx" ON "group_audit_log" USING btree ("created_at");

