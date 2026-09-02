/**
 * NGEMBA schema v0 — Phase 0 draft.
 * Full draft: docs/ngemba/02-SCHEMA-DB-DRAFT.md
 */
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const alertStatusEnum = pgEnum("ng_alert_status", [
  "opened",
  "active",
  "oriented",
  "closed",
  "cancelled",
]);

export const urgencyEnum = pgEnum("ng_urgency", [
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

export const alertSourceEnum = pgEnum("ng_alert_source", [
  "sos_button",
  "shake",
  "witness",
  "chat",
  "school",
]);

export const ngUsers = pgTable("ng_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: text("phone"),
  email: text("email"),
  displayName: text("display_name"),
  locale: text("locale").notNull().default("fr"),
  discreteAlertEnabled: boolean("discrete_alert_enabled")
    .notNull()
    .default(false),
  discreteTrigger: jsonb("discrete_trigger"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const alertSessions = pgTable("alert_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: alertStatusEnum("status").notNull().default("opened"),
  source: alertSourceEnum("source").notNull().default("sos_button"),
  userId: uuid("user_id").references(() => ngUsers.id),
  anonymousToken: text("anonymous_token"),
  urgency: urgencyEnum("urgency").notNull().default("info"),
  category: text("category"),
  immediateDanger: boolean("immediate_danger").notNull().default(false),
  lat: numeric("lat"),
  lng: numeric("lng"),
  locationLabel: text("location_label"),
  commune: text("commune"),
  locationSource: text("location_source"),
  locationAccuracyM: integer("location_accuracy_m"),
  locationConsentAt: timestamp("location_consent_at", { withTimezone: true }),
  message: text("message"),
  aiSummary: text("ai_summary"),
  aiConfidence: numeric("ai_confidence"),
  aiPayload: jsonb("ai_payload"),
  routingQueue: text("routing_queue"),
  provider: text("provider"),
  aiMode: text("ai_mode"),
  assignedTo: text("assigned_to"),
  humanVerifiedAt: timestamp("human_verified_at", { withTimezone: true }),
  operatorNotes: text("operator_notes"),
  locale: text("locale").notNull().default("fr"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  orientedAt: timestamp("oriented_at", { withTimezone: true }),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});
