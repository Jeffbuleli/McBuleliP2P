import { sql } from "drizzle-orm";
import { getDb } from "@/db";

/** Single global lock so only one tick runs (multi-instance Render / cron + inline). */
const ADVISORY_LOCK_KEY = 9_051_321;

export async function withBotCronLock<T>(
  fn: () => Promise<T>,
): Promise<T | null> {
  const db = getDb();
  const rows = await db.execute(
    sql`SELECT pg_try_advisory_lock(${ADVISORY_LOCK_KEY})::boolean AS acquired`,
  );
  const first = rows[0] as Record<string, unknown> | undefined;
  const acquired = first?.acquired === true || first?.acquired === "t";
  if (!acquired) return null;

  try {
    return await fn();
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(${ADVISORY_LOCK_KEY})`);
  }
}
