#!/usr/bin/env node
/**
 * Backfill users.email_canonical (Gmail dot rules + domain typo fix).
 * Requires DATABASE_URL — run after drizzle/0050_user_email_canonical.sql
 *
 *   npm run db:backfill-email-canonical
 */
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const envPath = path.join(process.cwd(), ".env.render");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const { canonicalEmailForDedup } = await import(
  "../src/lib/auth/email-normalize.ts"
);

const sql = postgres(dbUrl, { max: 1 });
const rows = await sql`SELECT id, email FROM users ORDER BY created_at ASC`;
let updated = 0;
const seen = new Map();

for (const row of rows) {
  const canonical = canonicalEmailForDedup(row.email);
  const prev = seen.get(canonical);
  if (prev && prev !== row.id) {
    console.warn(
      "DUPLICATE canonical (fix manually):",
      canonical,
      "ids:",
      prev,
      row.id,
      row.email,
    );
  } else {
    seen.set(canonical, row.id);
  }
  await sql`
    UPDATE users SET email_canonical = ${canonical} WHERE id = ${row.id}
  `;
  updated++;
}

await sql.end();
console.log(`Backfilled email_canonical for ${updated} users.`);
