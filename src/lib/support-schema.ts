import { sql } from "drizzle-orm";
import { getDb } from "@/db";

let schemaReady: Promise<void> | null = null;

/** Idempotent DDL so support works before manual migrate on Render. */
export function ensureSupportSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = runEnsureSupportSchema().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

async function runEnsureSupportSchema(): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS support_threads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_to_user_id uuid REFERENCES users(id),
      status varchar(16) DEFAULT 'open' NOT NULL,
      last_message_at timestamptz DEFAULT now() NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      closed_at timestamptz,
      closed_reason varchar(16)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS support_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      thread_id uuid NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
      sender_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body text NOT NULL,
      attachments jsonb,
      mentions jsonb,
      created_at timestamptz DEFAULT now() NOT NULL
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS support_message_reads (
      message_id uuid NOT NULL REFERENCES support_messages(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      read_at timestamptz DEFAULT now() NOT NULL,
      PRIMARY KEY (message_id, user_id)
    )
  `);
  await db.execute(sql`
    ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS closed_at timestamptz
  `);
  await db.execute(sql`
    ALTER TABLE support_threads ADD COLUMN IF NOT EXISTS closed_reason varchar(16)
  `);
  await db.execute(sql`DROP INDEX IF EXISTS support_threads_user_uq`);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS support_threads_last_msg_idx ON support_threads (last_message_at)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS support_threads_assigned_idx ON support_threads (assigned_to_user_id)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS support_threads_user_status_idx ON support_threads (user_id, status)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS support_messages_thread_created_idx ON support_messages (thread_id, created_at)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS support_message_reads_user_idx ON support_message_reads (user_id)
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS support_threads_user_open_uq
    ON support_threads (user_id) WHERE status = 'open'
  `);
}
