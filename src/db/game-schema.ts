import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  jsonb,
  boolean,
  bigint,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { users } from "./schema";

/** McBuleli Congo Mining Simulator - player state (links Community user). */
export const gamePlayers = pgTable(
  "game_players",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 32 }).notNull().default("artisanal_miner"),
    lifestyleTier: integer("lifestyle_tier").notNull().default(1),
    xp: integer("xp").notNull().default(0),
    reputation: integer("reputation").notNull().default(0),
    mcbBalance: numeric("mcb_balance", { precision: 18, scale: 4 })
      .notNull()
      .default("25"),
    energy: integer("energy").notNull().default(100),
    energyCap: integer("energy_cap").notNull().default(100),
    lastEnergyAt: timestamp("last_energy_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    worldSeed: varchar("world_seed", { length: 64 }).notNull(),
    regionKey: varchar("region_key", { length: 32 }).notNull().default("katanga"),
    campLevel: integer("camp_level").notNull().default(1),
    unlockedRoles: jsonb("unlocked_roles").$type<string[]>().notNull().default([]),
    achievements: jsonb("achievements").$type<string[]>().notNull().default([]),
    stats: jsonb("stats")
      .$type<Record<string, number>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("game_players_role_idx").on(t.role, t.xp)],
);

export const gameEconomyPrices = pgTable("game_economy_prices", {
  mineralKey: varchar("mineral_key", { length: 32 }).primaryKey(),
  label: varchar("label", { length: 64 }).notNull(),
  basePriceMcb: numeric("base_price_mcb", { precision: 18, scale: 4 }).notNull(),
  currentPriceMcb: numeric("current_price_mcb", { precision: 18, scale: 4 }).notNull(),
  demandIndex: numeric("demand_index", { precision: 8, scale: 4 }).notNull().default("1"),
  supplyIndex: numeric("supply_index", { precision: 8, scale: 4 }).notNull().default("1"),
  volatility: numeric("volatility", { precision: 6, scale: 4 }).notNull().default("0.08"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gameWorldEvents = pgTable(
  "game_world_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventKey: varchar("event_key", { length: 64 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull().default(""),
    effects: jsonb("effects").$type<Record<string, number>>().notNull().default({}),
    severity: varchar("severity", { length: 16 }).notNull().default("medium"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("game_world_events_active_idx").on(t.active, t.endsAt),
    index("game_world_events_key_idx").on(t.eventKey),
  ],
);

export const gameMiningSites = pgTable(
  "game_mining_sites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => gamePlayers.userId, { onDelete: "cascade" }),
    siteKey: varchar("site_key", { length: 64 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    mineralKey: varchar("mineral_key", { length: 32 }).notNull(),
    richness: numeric("richness", { precision: 5, scale: 4 }).notNull().default("0.5"),
    status: varchar("status", { length: 16 }).notNull().default("idle"),
    workerCount: integer("worker_count").notNull().default(0),
    lastMinedAt: timestamp("last_mined_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("game_mining_sites_player_idx").on(t.playerId, t.status)],
);

export const gameMineralStocks = pgTable(
  "game_mineral_stocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => gamePlayers.userId, { onDelete: "cascade" }),
    mineralKey: varchar("mineral_key", { length: 32 }).notNull(),
    quantityKg: numeric("quantity_kg", { precision: 18, scale: 4 }).notNull().default("0"),
    purityPct: numeric("purity_pct", { precision: 5, scale: 2 }).notNull().default("75"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("game_mineral_stocks_player_mineral").on(t.playerId, t.mineralKey),
    index("game_mineral_stocks_player_idx").on(t.playerId),
  ],
);

export const gameTransportJobs = pgTable(
  "game_transport_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => gamePlayers.userId, { onDelete: "cascade" }),
    mineralKey: varchar("mineral_key", { length: 32 }).notNull(),
    quantityKg: numeric("quantity_kg", { precision: 18, scale: 4 }).notNull(),
    fromLocation: varchar("from_location", { length: 64 }).notNull(),
    toLocation: varchar("to_location", { length: 64 }).notNull(),
    vehicleKey: varchar("vehicle_key", { length: 64 }),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completesAt: timestamp("completes_at", { withTimezone: true }),
    rewardMcb: numeric("reward_mcb", { precision: 18, scale: 4 }),
    riskFactor: numeric("risk_factor", { precision: 5, scale: 4 }).notNull().default("0.1"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("game_transport_jobs_player_status_idx").on(t.playerId, t.status),
    index("game_transport_jobs_completes_idx").on(t.completesAt),
  ],
);

export const gameVehicles = pgTable(
  "game_vehicles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => gamePlayers.userId, { onDelete: "cascade" }),
    vehicleKey: varchar("vehicle_key", { length: 64 }).notNull(),
    conditionPct: integer("condition_pct").notNull().default(100),
    fuelPct: integer("fuel_pct").notNull().default(100),
    assigned: boolean("assigned").notNull().default(false),
    acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("game_vehicles_player_idx").on(t.playerId)],
);

export const gameInventory = pgTable(
  "game_inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => gamePlayers.userId, { onDelete: "cascade" }),
    itemKey: varchar("item_key", { length: 64 }).notNull(),
    category: varchar("category", { length: 24 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("game_inventory_player_item").on(t.playerId, t.itemKey),
    index("game_inventory_player_idx").on(t.playerId, t.category),
  ],
);

export const gameWorkers = pgTable(
  "game_workers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => gamePlayers.userId, { onDelete: "cascade" }),
    workerKey: varchar("worker_key", { length: 64 }).notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    skill: integer("skill").notNull().default(50),
    salaryMcbDay: numeric("salary_mcb_day", { precision: 18, scale: 4 }).notNull(),
    assignedSiteId: uuid("assigned_site_id").references(() => gameMiningSites.id, {
      onDelete: "set null",
    }),
    morale: integer("morale").notNull().default(70),
    hiredAt: timestamp("hired_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("game_workers_player_idx").on(t.playerId)],
);

export const gameBusinesses = pgTable(
  "game_businesses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => gamePlayers.userId, { onDelete: "cascade" }),
    businessType: varchar("business_type", { length: 32 }).notNull(),
    level: integer("level").notNull().default(1),
    dailyUpkeepMcb: numeric("daily_upkeep_mcb", { precision: 18, scale: 4 }).notNull(),
    dailyRevenueMcb: numeric("daily_revenue_mcb", { precision: 18, scale: 4 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("game_businesses_player_idx").on(t.playerId)],
);

export const gameProperties = pgTable(
  "game_properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => gamePlayers.userId, { onDelete: "cascade" }),
    propertyType: varchar("property_type", { length: 32 }).notNull(),
    tier: integer("tier").notNull().default(1),
    locationKey: varchar("location_key", { length: 64 }).notNull(),
    acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("game_properties_player_idx").on(t.playerId, t.propertyType)],
);

export const gameTransactions = pgTable(
  "game_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => gamePlayers.userId, { onDelete: "cascade" }),
    direction: varchar("direction", { length: 8 }).notNull(),
    amountMcb: numeric("amount_mcb", { precision: 18, scale: 4 }).notNull(),
    balanceAfter: numeric("balance_after", { precision: 18, scale: 4 }).notNull(),
    category: varchar("category", { length: 32 }).notNull(),
    referenceId: uuid("reference_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("game_transactions_player_created_idx").on(t.playerId, t.createdAt),
    index("game_transactions_category_idx").on(t.category, t.createdAt),
  ],
);

export const gameMaintenanceLogs = pgTable(
  "game_maintenance_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => gamePlayers.userId, { onDelete: "cascade" }),
    assetCategory: varchar("asset_category", { length: 24 }).notNull(),
    assetId: uuid("asset_id"),
    costMcb: numeric("cost_mcb", { precision: 18, scale: 4 }).notNull(),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("game_maintenance_logs_player_idx").on(t.playerId, t.createdAt)],
);

export const gameAdvisorLogs = pgTable(
  "game_advisor_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => gamePlayers.userId, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    model: varchar("model", { length: 48 }).notNull().default("gpt-4o-mini"),
    tokensUsed: integer("tokens_used").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("game_advisor_logs_player_idx").on(t.playerId, t.createdAt)],
);

export const gameTickMeta = pgTable("game_tick_meta", {
  id: integer("id").primaryKey().default(1),
  lastTickAt: timestamp("last_tick_at", { withTimezone: true }).notNull().defaultNow(),
  tickCount: bigint("tick_count", { mode: "number" }).notNull().default(0),
});
