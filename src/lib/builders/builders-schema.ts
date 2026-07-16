import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

let ready: Promise<void> | null = null;

/** Idempotent — USD anchor columns before migrate on VPS. */
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
