import { getPgClient } from "@/db";

/** Single global lock so only one tick runs (multi-instance Render / cron + inline). */
const ADVISORY_LOCK_KEY = 9_051_321;

/**
 * Session advisory locks must be acquired and released on the same Postgres connection.
 * The shared pool would otherwise unlock on a different session → PG warning 01000.
 */
export async function withBotCronLock<T>(
  fn: () => Promise<T>,
): Promise<T | null> {
  const sql = getPgClient();
  const reserved = await sql.reserve();
  try {
    const rows = await reserved<{ acquired: boolean }[]>`
      SELECT pg_try_advisory_lock(${ADVISORY_LOCK_KEY})::boolean AS acquired
    `;
    const acquired = rows[0]?.acquired === true;
    if (!acquired) return null;

    try {
      return await fn();
    } finally {
      await reserved`SELECT pg_advisory_unlock(${ADVISORY_LOCK_KEY})`;
    }
  } finally {
    reserved.release();
  }
}
