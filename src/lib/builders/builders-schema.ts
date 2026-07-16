import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

let ready: Promise<void> | null = null;

/** Idempotent DDL — table + USD columns (VPS often skips drizzle migrate). */
export function ensureBuildersSchema(): Promise<void> {
  if (!ready) {
    ready = run().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

async function run(): Promise<void> {
  const db = getDb();

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS builders_memberships (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tier varchar(16) NOT NULL,
      status varchar(16) NOT NULL DEFAULT 'pending',
      paid_mcb numeric(36, 18) NOT NULL,
      payment_kind varchar(24) NOT NULL DEFAULT 'onchain_tx',
      wallet_address varchar(64),
      tx_hash varchar(128),
      reject_reason text,
      starts_at timestamptz,
      expires_at timestamptz,
      processed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      processed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      paid_usd_notional numeric(18, 6),
      mcb_usd_rate numeric(36, 18),
      fee_perks_unlocked boolean NOT NULL DEFAULT false
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS builders_memberships_user_status_idx
    ON builders_memberships (user_id, status, created_at DESC)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS builders_memberships_status_created_idx
    ON builders_memberships (status, created_at DESC)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS builders_memberships_tier_idx
    ON builders_memberships (tier, status)
  `);

  await db.execute(sql`
    ALTER TABLE builders_memberships
    ADD COLUMN IF NOT EXISTS paid_usd_notional numeric(18, 6)
  `);
  await db.execute(sql`
    ALTER TABLE builders_memberships
    ADD COLUMN IF NOT EXISTS mcb_usd_rate numeric(36, 18)
  `);
  await db.execute(sql`
    ALTER TABLE builders_memberships
    ADD COLUMN IF NOT EXISTS fee_perks_unlocked boolean NOT NULL DEFAULT false
  `);
}
