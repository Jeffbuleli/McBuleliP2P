#!/usr/bin/env node
/**
 * Test DB + scanner without hitting production HTTP.
 * Usage: set -a && source .env.render && set +a && node scripts/test-wallet-deposit-scan-db.mjs
 */
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(url, { max: 1, ssl: { rejectUnauthorized: false } });

try {
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'deposit_sessions'
  `;
  console.log("deposit_sessions table:", tables.length ? "yes" : "NO");

  const [{ count }] = await sql`SELECT count(*)::int AS count FROM deposit_sessions`;
  console.log("deposit_sessions rows:", count);

  const sessions = await sql`
    SELECT id, status FROM deposit_sessions
    WHERE status IN ('ACTIVE', 'EXPIRED')
    ORDER BY created_at ASC
    LIMIT 5
  `;
  console.log("scannable sessions:", sessions.length, sessions);

  console.log("OK — DB side looks fine. If HTTP 500 persists, redeploy Web service (commit ba95f5d+).");
} catch (e) {
  console.error("DB error:", e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 2 });
}
