#!/usr/bin/env node
/**
 * Backfill users.email_canonical (Gmail dot rules + domain typo fix).
 * Creates column + unique index if missing. Run after db:migrate:render or standalone.
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
  console.error("DATABASE_URL missing — set in .env.render or export DATABASE_URL");
  process.exit(1);
}

const { canonicalEmailForDedup } = await import(
  "../src/lib/auth/email-normalize.ts"
);

const sql = postgres(dbUrl, { max: 1 });

async function ensureColumn() {
  const [col] = await sql`
    SELECT 1 AS ok
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'email_canonical'
    LIMIT 1
  `;
  if (col?.ok) return;
  console.log("Adding users.email_canonical…");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_canonical varchar(255)`;
}

await ensureColumn();

const rows = await sql`SELECT id, email FROM users ORDER BY created_at ASC`;
let updated = 0;
const seen = new Map();
const duplicatePairs = [];

for (const row of rows) {
  const canonical = canonicalEmailForDedup(row.email);
  const prev = seen.get(canonical);
  if (prev && prev.id !== row.id) {
    duplicatePairs.push({
      canonical,
      a: prev,
      b: { id: row.id, email: row.email },
    });
    console.warn(
      "DUPLICATE canonical:",
      canonical,
      "→",
      prev.email,
      "and",
      row.email,
    );
  } else if (!prev) {
    seen.set(canonical, { id: row.id, email: row.email });
  }
  await sql`
    UPDATE users SET email_canonical = ${canonical} WHERE id = ${row.id}
  `;
  updated++;
}

if (duplicatePairs.length === 0) {
  console.log("Creating unique index users_email_canonical_unique…");
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_canonical_unique
      ON users (email_canonical)
      WHERE email_canonical IS NOT NULL
  `;
} else {
  console.error(
    `\n${duplicatePairs.length} duplicate canonical(s) — fix with admin-user-account.cjs retire before creating unique index.`,
  );
  console.error("See docs/auth-email-dedup.md");
  process.exitCode = 1;
}

await sql.end();
console.log(`Backfilled email_canonical for ${updated} users.`);
