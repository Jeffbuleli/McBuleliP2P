CREATE TABLE "deposits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(16) NOT NULL,
	"asset" varchar(32) NOT NULL,
	"network_canonical" varchar(32) NOT NULL,
	"network_cex" varchar(64) NOT NULL,
	"address_shown" text NOT NULL,
	"memo_shown" text,
	"min_confirmations" integer DEFAULT 1 NOT NULL,
	"status" varchar(32) NOT NULL,
	"failure_reason" text,
	"txid" varchar(512),
	"amount" numeric(36, 18),
	"user_marked_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "txid_ledger" (
	"txid_norm" varchar(512) PRIMARY KEY NOT NULL,
	"provider" varchar(16) NOT NULL,
	"deposit_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"balance" numeric(36, 18) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(16) NOT NULL,
	"asset" varchar(32) NOT NULL,
	"network_canonical" varchar(32) NOT NULL,
	"network_cex" varchar(64) NOT NULL,
	"to_address" text NOT NULL,
	"memo_to" text,
	"amount" numeric(36, 18) NOT NULL,
	"fee" numeric(36, 18) DEFAULT '0' NOT NULL,
	"status" varchar(32) NOT NULL,
	"failure_reason" text,
	"external_id" varchar(128),
	"txid" varchar(512),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "txid_ledger" ADD CONSTRAINT "txid_ledger_deposit_id_deposits_id_fk" FOREIGN KEY ("deposit_id") REFERENCES "public"."deposits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deposits_user_idx" ON "deposits" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "deposits_txid_unique" ON "deposits" USING btree ("txid") WHERE "deposits"."txid" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "txid_ledger_deposit_idx" ON "txid_ledger" USING btree ("deposit_id");--> statement-breakpoint
CREATE INDEX "withdrawals_user_idx" ON "withdrawals" USING btree ("user_id");