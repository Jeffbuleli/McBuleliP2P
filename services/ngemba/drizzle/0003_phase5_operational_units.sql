CREATE TABLE "ng_operational_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_seed_id" text,
	"organization_id" uuid,
	"name" text NOT NULL,
	"unit_type" text DEFAULT 'other' NOT NULL,
	"capabilities" jsonb DEFAULT '[]'::jsonb,
	"capacity" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'AVAILABLE' NOT NULL,
	"lat" numeric,
	"lng" numeric,
	"location_label" text,
	"zone_province_ids" jsonb DEFAULT '[]'::jsonb,
	"zone_communes" jsonb DEFAULT '[]'::jsonb,
	"accreditation_level" integer DEFAULT 1 NOT NULL,
	"assigned_session_id" text,
	"eta_minutes" integer,
	"reliability_score" integer DEFAULT 70 NOT NULL,
	"last_heartbeat_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ng_operational_units" ADD CONSTRAINT "ng_operational_units_organization_id_ng_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."ng_organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ng_units_status_idx" ON "ng_operational_units" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ng_units_partner_idx" ON "ng_operational_units" USING btree ("partner_seed_id");--> statement-breakpoint
CREATE INDEX "ng_units_type_idx" ON "ng_operational_units" USING btree ("unit_type");