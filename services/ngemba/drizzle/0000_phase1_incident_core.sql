CREATE TYPE "public"."ng_alert_source" AS ENUM('sos_button', 'shake', 'witness', 'chat', 'school');--> statement-breakpoint
CREATE TYPE "public"."ng_alert_status" AS ENUM('opened', 'active', 'oriented', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ng_urgency" AS ENUM('critical', 'high', 'medium', 'low', 'info');--> statement-breakpoint
CREATE TABLE "alert_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"status" "ng_alert_status" DEFAULT 'opened' NOT NULL,
	"source" "ng_alert_source" DEFAULT 'sos_button' NOT NULL,
	"user_id" uuid,
	"anonymous_token" text,
	"urgency" "ng_urgency" DEFAULT 'info' NOT NULL,
	"category" text,
	"immediate_danger" boolean DEFAULT false NOT NULL,
	"lat" numeric,
	"lng" numeric,
	"location_label" text,
	"commune" text,
	"location_source" text,
	"location_accuracy_m" integer,
	"location_consent_at" timestamp with time zone,
	"message" text,
	"ai_summary" text,
	"ai_confidence" numeric,
	"ai_payload" jsonb,
	"routing_queue" text,
	"auto_route" boolean DEFAULT false NOT NULL,
	"provider" text,
	"ai_mode" text,
	"assigned_to" text,
	"human_verified_at" timestamp with time zone,
	"operator_notes" text,
	"locale" text DEFAULT 'fr' NOT NULL,
	"client_ip" text,
	"user_agent" text,
	"discrete_mode" boolean DEFAULT false NOT NULL,
	"trusted_contacts" jsonb DEFAULT '[]'::jsonb,
	"school_context" jsonb,
	"routing_meta" jsonb,
	"status_history" jsonb DEFAULT '[]'::jsonb,
	"media" jsonb DEFAULT '[]'::jsonb,
	"chat_messages" jsonb DEFAULT '[]'::jsonb,
	"sla_due_at" timestamp with time zone,
	"escalation" jsonb,
	"record_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"oriented_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"event_type" text NOT NULL,
	"status" text,
	"actor" text,
	"note" text,
	"payload" jsonb
);
--> statement-breakpoint
CREATE TABLE "ng_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text,
	"email" text,
	"display_name" text,
	"locale" text DEFAULT 'fr' NOT NULL,
	"discrete_alert_enabled" boolean DEFAULT false NOT NULL,
	"discrete_trigger" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_sessions" ADD CONSTRAINT "alert_sessions_user_id_ng_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ng_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_events" ADD CONSTRAINT "incident_events_session_id_alert_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."alert_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alert_sessions_status_urgency_created_idx" ON "alert_sessions" USING btree ("status","urgency","created_at");--> statement-breakpoint
CREATE INDEX "alert_sessions_anonymous_token_idx" ON "alert_sessions" USING btree ("anonymous_token");--> statement-breakpoint
CREATE INDEX "alert_sessions_created_idx" ON "alert_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "incident_events_session_at_idx" ON "incident_events" USING btree ("session_id","at");--> statement-breakpoint
CREATE INDEX "incident_events_type_idx" ON "incident_events" USING btree ("event_type");