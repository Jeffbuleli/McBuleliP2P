CREATE TABLE "ng_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"service_code" text NOT NULL,
	"service_id" text,
	"organization_id" text,
	"partner_seed_id" text,
	"rank" integer DEFAULT 1 NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"reason" text,
	"scope" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ng_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"partner_seed_id" text,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"categories" jsonb DEFAULT '[]'::jsonb,
	"coverage_province_ids" jsonb DEFAULT '[]'::jsonb,
	"coverage_communes" jsonb DEFAULT '[]'::jsonb,
	"national_fallback" boolean DEFAULT false NOT NULL,
	"hours_json" jsonb,
	"capacity_hint" integer,
	"contact_hint" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ng_referrals" ADD CONSTRAINT "ng_referrals_session_id_alert_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."alert_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ng_services" ADD CONSTRAINT "ng_services_organization_id_ng_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."ng_organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ng_referrals_session_idx" ON "ng_referrals" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "ng_referrals_code_idx" ON "ng_referrals" USING btree ("service_code");--> statement-breakpoint
CREATE INDEX "ng_services_code_idx" ON "ng_services" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ng_services_partner_idx" ON "ng_services" USING btree ("partner_seed_id");--> statement-breakpoint
CREATE INDEX "ng_services_org_idx" ON "ng_services" USING btree ("organization_id");