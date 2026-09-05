/**
 * NGEMBA schema - Phase 1 Incident Core.
 * Runtime dual-write with JSON file until Postgres is primary.
 * Draft history: docs/ngemba/02-SCHEMA-DB-DRAFT.md
 */
import {
  boolean,
  index,
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

/**
 * alert_sessions = Incident Core v1 (API still uses "session" naming).
 * Nested blobs kept as jsonb for Phase 1 (media/chat/contacts/history).
 */
export const alertSessions = pgTable(
  "alert_sessions",
  {
    id: uuid("id").primaryKey(),
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
    autoRoute: boolean("auto_route").notNull().default(false),
    provider: text("provider"),
    aiMode: text("ai_mode"),
    assignedTo: text("assigned_to"),
    humanVerifiedAt: timestamp("human_verified_at", { withTimezone: true }),
    operatorNotes: text("operator_notes"),
    locale: text("locale").notNull().default("fr"),
    clientIp: text("client_ip"),
    userAgent: text("user_agent"),
    discreteMode: boolean("discrete_mode").notNull().default(false),
    trustedContacts: jsonb("trusted_contacts").$type<unknown[]>().default([]),
    schoolContext: jsonb("school_context"),
    routingMeta: jsonb("routing_meta"),
    statusHistory: jsonb("status_history").$type<unknown[]>().default([]),
    media: jsonb("media").$type<unknown[]>().default([]),
    chatMessages: jsonb("chat_messages").$type<unknown[]>().default([]),
    slaDueAt: timestamp("sla_due_at", { withTimezone: true }),
    escalation: jsonb("escalation"),
    /** Full AlertSessionRecord mirror for forward-compat / recovery. */
    recordJson: jsonb("record_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    orientedAt: timestamp("oriented_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("alert_sessions_status_urgency_created_idx").on(
      t.status,
      t.urgency,
      t.createdAt,
    ),
    index("alert_sessions_anonymous_token_idx").on(t.anonymousToken),
    index("alert_sessions_created_idx").on(t.createdAt),
  ],
);

/** Immutable timeline for incident lifecycle (Phase 1). */
export const incidentEvents = pgTable(
  "incident_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => alertSessions.id, { onDelete: "cascade" }),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    eventType: text("event_type").notNull(),
    status: text("status"),
    actor: text("actor"),
    note: text("note"),
    payload: jsonb("payload"),
  },
  (t) => [
    index("incident_events_session_at_idx").on(t.sessionId, t.at),
    index("incident_events_type_idx").on(t.eventType),
  ],
);

/** Phase 3 - organisations ops (DB; seed bridge aussi en memoire). */
export const ngOrganizations = pgTable(
  "ng_organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    orgType: text("org_type").notNull().default("ngo"),
    verified: boolean("verified").notNull().default(false),
    active: boolean("active").notNull().default(true),
    mandate: jsonb("mandate").$type<string[]>().default([]),
    coverageProvinceIds: jsonb("coverage_province_ids")
      .$type<string[]>()
      .default([]),
    coverageCommunes: jsonb("coverage_communes").$type<string[]>().default([]),
    nationalFallback: boolean("national_fallback").notNull().default(false),
    partnerSeedId: text("partner_seed_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("ng_organizations_slug_idx").on(t.slug)],
);

export const ngOrgMembers = pgTable(
  "ng_org_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => ngOrganizations.id, { onDelete: "cascade" }),
    email: text("email"),
    displayName: text("display_name"),
    /** Token ops legacy bridge (hash or env key name) - never store raw long-term ideally. */
    legacyTokenEnv: text("legacy_token_env"),
    role: text("role").notNull().default("ngo"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ng_org_members_org_idx").on(t.organizationId),
    index("ng_org_members_email_idx").on(t.email),
  ],
);

export const ngAccreditations = pgTable(
  "ng_accreditations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: uuid("member_id")
      .notNull()
      .references(() => ngOrgMembers.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => ngOrganizations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    level: integer("level").notNull().default(1),
    scopes: jsonb("scopes").$type<string[]>().default([]),
    territoryProvinceIds: jsonb("territory_province_ids")
      .$type<string[]>()
      .default([]),
    territoryCommunes: jsonb("territory_communes").$type<string[]>().default([]),
    categories: jsonb("categories").$type<string[]>().default([]),
    status: text("status").notNull().default("active"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ng_accreditations_member_idx").on(t.memberId),
    index("ng_accreditations_status_idx").on(t.status),
  ],
);

export const ngAuditAccessLog = pgTable(
  "ng_audit_access_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    actorId: text("actor_id").notNull(),
    actorLabel: text("actor_label"),
    organizationId: text("organization_id"),
    role: text("role"),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    action: text("action").notNull(),
    scope: text("scope"),
    allowed: boolean("allowed").notNull().default(true),
    reason: text("reason"),
    ipHash: text("ip_hash"),
    meta: jsonb("meta"),
  },
  (t) => [
    index("ng_audit_access_resource_idx").on(t.resourceType, t.resourceId),
    index("ng_audit_access_actor_idx").on(t.actorId),
    index("ng_audit_access_at_idx").on(t.at),
  ],
);

/** Phase 4 - catalogue de services (referral / futur dispatch). */
export const ngServices = pgTable(
  "ng_services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Lien org DB (nullable si seed-only). */
    organizationId: uuid("organization_id").references(() => ngOrganizations.id, {
      onDelete: "set null",
    }),
    /** Lien seed partenaire (ex. jgl-africa). */
    partnerSeedId: text("partner_seed_id"),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    categories: jsonb("categories").$type<string[]>().default([]),
    coverageProvinceIds: jsonb("coverage_province_ids")
      .$type<string[]>()
      .default([]),
    coverageCommunes: jsonb("coverage_communes").$type<string[]>().default([]),
    nationalFallback: boolean("national_fallback").notNull().default(false),
    hoursJson: jsonb("hours_json"),
    capacityHint: integer("capacity_hint"),
    contactHint: text("contact_hint"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ng_services_code_idx").on(t.code),
    index("ng_services_partner_idx").on(t.partnerSeedId),
    index("ng_services_org_idx").on(t.organizationId),
  ],
);

/** Suggestions d'orientation journalisees (audit referral). */
export const ngReferrals = pgTable(
  "ng_referrals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => alertSessions.id, { onDelete: "cascade" }),
    serviceCode: text("service_code").notNull(),
    serviceId: text("service_id"),
    organizationId: text("organization_id"),
    partnerSeedId: text("partner_seed_id"),
    rank: integer("rank").notNull().default(1),
    score: integer("score").notNull().default(0),
    reason: text("reason"),
    scope: text("scope"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ng_referrals_session_idx").on(t.sessionId),
    index("ng_referrals_code_idx").on(t.serviceCode),
  ],
);

/** Phase 5 - unites operationnelles (pas encore dispatch auto). */
export const ngOperationalUnits = pgTable(
  "ng_operational_units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partnerSeedId: text("partner_seed_id"),
    organizationId: uuid("organization_id").references(() => ngOrganizations.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    unitType: text("unit_type").notNull().default("other"),
    capabilities: jsonb("capabilities").$type<string[]>().default([]),
    capacity: integer("capacity").notNull().default(1),
    status: text("status").notNull().default("AVAILABLE"),
    lat: numeric("lat"),
    lng: numeric("lng"),
    locationLabel: text("location_label"),
    zoneProvinceIds: jsonb("zone_province_ids").$type<string[]>().default([]),
    zoneCommunes: jsonb("zone_communes").$type<string[]>().default([]),
    accreditationLevel: integer("accreditation_level").notNull().default(1),
    assignedSessionId: text("assigned_session_id"),
    etaMinutes: integer("eta_minutes"),
    reliabilityScore: integer("reliability_score").notNull().default(70),
    lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ng_units_status_idx").on(t.status),
    index("ng_units_partner_idx").on(t.partnerSeedId),
    index("ng_units_type_idx").on(t.unitType),
  ],
);
