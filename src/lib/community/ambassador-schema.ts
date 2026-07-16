import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

let ready: Promise<void> | null = null;

/** Idempotent DDL — VPS often skips drizzle migrate. */
export function ensureAmbassadorSchema(): Promise<void> {
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
    CREATE TABLE IF NOT EXISTS ambassador_applications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status varchar(16) NOT NULL DEFAULT 'pending',
      region varchar(120) NOT NULL,
      motivation text NOT NULL,
      experience text,
      languages varchar(120),
      charter_version varchar(16) NOT NULL,
      charter_accepted_at timestamptz NOT NULL,
      builder_tier_at_apply varchar(16) NOT NULL,
      reject_reason text,
      starts_at timestamptz,
      ends_at timestamptz,
      processed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      processed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS ambassador_applications_user_status_idx
    ON ambassador_applications (user_id, status, created_at DESC)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS ambassador_applications_status_created_idx
    ON ambassador_applications (status, created_at DESC)
  `);
}
