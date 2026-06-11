import { sql } from "drizzle-orm";
import { getDb } from "@/db";

let schemaReady: Promise<void> | null = null;

export function ensureGameSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = runEnsureGameSchema().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

async function runEnsureGameSchema(): Promise<void> {
  const db = getDb();

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_players (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      role varchar(32) NOT NULL DEFAULT 'artisanal_miner',
      lifestyle_tier integer NOT NULL DEFAULT 1,
      xp integer NOT NULL DEFAULT 0,
      reputation integer NOT NULL DEFAULT 0,
      mcb_balance numeric(18,4) NOT NULL DEFAULT 25,
      energy integer NOT NULL DEFAULT 100,
      energy_cap integer NOT NULL DEFAULT 100,
      last_energy_at timestamptz NOT NULL DEFAULT now(),
      world_seed varchar(64) NOT NULL,
      region_key varchar(32) NOT NULL DEFAULT 'katanga',
      camp_level integer NOT NULL DEFAULT 1,
      unlocked_roles jsonb NOT NULL DEFAULT '[]',
      achievements jsonb NOT NULL DEFAULT '[]',
      stats jsonb NOT NULL DEFAULT '{}',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_economy_prices (
      mineral_key varchar(32) PRIMARY KEY,
      label varchar(64) NOT NULL,
      base_price_mcb numeric(18,4) NOT NULL,
      current_price_mcb numeric(18,4) NOT NULL,
      demand_index numeric(8,4) NOT NULL DEFAULT 1,
      supply_index numeric(8,4) NOT NULL DEFAULT 1,
      volatility numeric(6,4) NOT NULL DEFAULT 0.08,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_world_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      event_key varchar(64) NOT NULL,
      title varchar(160) NOT NULL,
      description text NOT NULL DEFAULT '',
      effects jsonb NOT NULL DEFAULT '{}',
      severity varchar(16) NOT NULL DEFAULT 'medium',
      starts_at timestamptz NOT NULL,
      ends_at timestamptz NOT NULL,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_mining_sites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id uuid NOT NULL REFERENCES game_players(user_id) ON DELETE CASCADE,
      site_key varchar(64) NOT NULL,
      name varchar(120) NOT NULL,
      mineral_key varchar(32) NOT NULL,
      richness numeric(5,4) NOT NULL DEFAULT 0.5,
      status varchar(16) NOT NULL DEFAULT 'idle',
      worker_count integer NOT NULL DEFAULT 0,
      last_mined_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_mineral_stocks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id uuid NOT NULL REFERENCES game_players(user_id) ON DELETE CASCADE,
      mineral_key varchar(32) NOT NULL,
      quantity_kg numeric(18,4) NOT NULL DEFAULT 0,
      purity_pct numeric(5,2) NOT NULL DEFAULT 75,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS game_mineral_stocks_player_mineral
    ON game_mineral_stocks (player_id, mineral_key)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_transport_jobs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id uuid NOT NULL REFERENCES game_players(user_id) ON DELETE CASCADE,
      mineral_key varchar(32) NOT NULL,
      quantity_kg numeric(18,4) NOT NULL,
      from_location varchar(64) NOT NULL,
      to_location varchar(64) NOT NULL,
      vehicle_key varchar(64),
      status varchar(16) NOT NULL DEFAULT 'pending',
      started_at timestamptz,
      completes_at timestamptz,
      reward_mcb numeric(18,4),
      risk_factor numeric(5,4) NOT NULL DEFAULT 0.1,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_vehicles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id uuid NOT NULL REFERENCES game_players(user_id) ON DELETE CASCADE,
      vehicle_key varchar(64) NOT NULL,
      condition_pct integer NOT NULL DEFAULT 100,
      fuel_pct integer NOT NULL DEFAULT 100,
      assigned boolean NOT NULL DEFAULT false,
      acquired_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_inventory (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id uuid NOT NULL REFERENCES game_players(user_id) ON DELETE CASCADE,
      item_key varchar(64) NOT NULL,
      category varchar(24) NOT NULL,
      quantity integer NOT NULL DEFAULT 1,
      metadata jsonb,
      acquired_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS game_inventory_player_item
    ON game_inventory (player_id, item_key)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_workers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id uuid NOT NULL REFERENCES game_players(user_id) ON DELETE CASCADE,
      worker_key varchar(64) NOT NULL,
      name varchar(80) NOT NULL,
      skill integer NOT NULL DEFAULT 50,
      salary_mcb_day numeric(18,4) NOT NULL,
      assigned_site_id uuid REFERENCES game_mining_sites(id) ON DELETE SET NULL,
      morale integer NOT NULL DEFAULT 70,
      hired_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_businesses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id uuid NOT NULL REFERENCES game_players(user_id) ON DELETE CASCADE,
      business_type varchar(32) NOT NULL,
      level integer NOT NULL DEFAULT 1,
      daily_upkeep_mcb numeric(18,4) NOT NULL,
      daily_revenue_mcb numeric(18,4) NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_properties (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id uuid NOT NULL REFERENCES game_players(user_id) ON DELETE CASCADE,
      property_type varchar(32) NOT NULL,
      tier integer NOT NULL DEFAULT 1,
      location_key varchar(64) NOT NULL,
      acquired_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_transactions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id uuid NOT NULL REFERENCES game_players(user_id) ON DELETE CASCADE,
      direction varchar(8) NOT NULL,
      amount_mcb numeric(18,4) NOT NULL,
      balance_after numeric(18,4) NOT NULL,
      category varchar(32) NOT NULL,
      reference_id uuid,
      meta jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_maintenance_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id uuid NOT NULL REFERENCES game_players(user_id) ON DELETE CASCADE,
      asset_category varchar(24) NOT NULL,
      asset_id uuid,
      cost_mcb numeric(18,4) NOT NULL,
      note text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_advisor_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id uuid NOT NULL REFERENCES game_players(user_id) ON DELETE CASCADE,
      question text NOT NULL,
      answer text NOT NULL,
      model varchar(48) NOT NULL DEFAULT 'gpt-4o-mini',
      tokens_used integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS game_tick_meta (
      id integer PRIMARY KEY DEFAULT 1,
      last_tick_at timestamptz NOT NULL DEFAULT now(),
      tick_count bigint NOT NULL DEFAULT 0
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS game_players_role_idx ON game_players (role, xp)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS game_mining_sites_player_idx ON game_mining_sites (player_id, status)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS game_transport_jobs_player_status_idx ON game_transport_jobs (player_id, status)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS game_transactions_player_created_idx ON game_transactions (player_id, created_at)
  `);
}
