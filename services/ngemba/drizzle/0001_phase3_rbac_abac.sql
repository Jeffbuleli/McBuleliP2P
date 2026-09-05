CREATE TABLE "ng_accreditations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb,
	"territory_province_ids" jsonb DEFAULT '[]'::jsonb,
	"territory_communes" jsonb DEFAULT '[]'::jsonb,
	"categories" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ng_audit_access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" text NOT NULL,
	"actor_label" text,
	"organization_id" text,
	"role" text,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"action" text NOT NULL,
	"scope" text,
	"allowed" boolean DEFAULT true NOT NULL,
	"reason" text,
	"ip_hash" text,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "ng_org_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text,
	"display_name" text,
	"legacy_token_env" text,
	"role" text DEFAULT 'ngo' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ng_organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"org_type" text DEFAULT 'ngo' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"mandate" jsonb DEFAULT '[]'::jsonb,
	"coverage_province_ids" jsonb DEFAULT '[]'::jsonb,
	"coverage_communes" jsonb DEFAULT '[]'::jsonb,
	"national_fallback" boolean DEFAULT false NOT NULL,
	"partner_seed_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ng_organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "ng_accreditations" ADD CONSTRAINT "ng_accreditations_member_id_ng_org_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."ng_org_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ng_accreditations" ADD CONSTRAINT "ng_accreditations_organization_id_ng_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."ng_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ng_org_members" ADD CONSTRAINT "ng_org_members_organization_id_ng_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."ng_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ng_accreditations_member_idx" ON "ng_accreditations" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "ng_accreditations_status_idx" ON "ng_accreditations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ng_audit_access_resource_idx" ON "ng_audit_access_log" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "ng_audit_access_actor_idx" ON "ng_audit_access_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "ng_audit_access_at_idx" ON "ng_audit_access_log" USING btree ("at");--> statement-breakpoint
CREATE INDEX "ng_org_members_org_idx" ON "ng_org_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ng_org_members_email_idx" ON "ng_org_members" USING btree ("email");--> statement-breakpoint
CREATE INDEX "ng_organizations_slug_idx" ON "ng_organizations" USING btree ("slug");