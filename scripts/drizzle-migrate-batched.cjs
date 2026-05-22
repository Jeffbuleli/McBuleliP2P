/**
 * Apply drizzle/ SQL migrations in **one transaction per journal entry**.
 * Drizzle's default migrator runs *all pending* migrations in a **single** transaction,
 * which can time out or fail opaquely on managed Postgres (e.g. Render) with many files.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function parseDotenv(contents) {
  const out = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const exportPrefix = line.startsWith("export ") ? "export ".length : 0;
    const body = exportPrefix ? line.slice(exportPrefix).trim() : line;
    const eq = body.indexOf("=");
    if (eq <= 0) continue;
    const key = body.slice(0, eq).trim();
    let value = body.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

function loadEnvFile(filePath) {
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing env file: ${abs}`);
  }
  const parsed = parseDotenv(fs.readFileSync(abs, "utf8"));
  for (const [k, v] of Object.entries(parsed)) {
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

const args = process.argv.slice(2);
let envFile = ".env.render";
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--env-file") {
    envFile = args[i + 1];
    if (!envFile) throw new Error("--env-file requires a path");
    i += 1;
  }
}

loadEnvFile(envFile);
if (!process.env.DATABASE_URL) {
  throw new Error(`DATABASE_URL missing after loading ${envFile}`);
}

const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");
const JOURNAL_PATH = path.join(MIGRATIONS_DIR, "meta", "_journal.json");
const SCHEMA = "drizzle";
const TABLE = "__drizzle_migrations";

const CONNECT_TIMEOUT_SEC = Number(process.env.DB_CONNECT_TIMEOUT_SEC || 90);
const CONNECT_RETRIES = Number(process.env.DB_CONNECT_RETRIES || 4);
const CONNECT_RETRY_DELAY_MS = Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 5000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectionHint(err) {
  const host =
    (() => {
      try {
        return new URL(process.env.DATABASE_URL.replace(/^postgres:/, "postgresql:"))
          .hostname;
      } catch {
        return "(unknown host)";
      }
    })() || "(unknown)";
  return [
    "",
    "[drizzle-migrate-batched] Could not reach PostgreSQL (CONNECT_TIMEOUT).",
    `  Host: ${host}`,
    "",
    "Checklist:",
    "  1. Render Dashboard → your Postgres → Status must be Available (free tier may be waking up — wait 1–2 min, retry).",
    "  2. Use the **External** Database URL in .env.render (not Internal — Internal only works from Render services).",
    "  3. Render → Postgres → Networking / Access → allow your IP or 0.0.0.0/0 for migrations from your Mac.",
    "  4. Test: npm run db:ping:render",
    "  5. VPN / firewall / corporate network often blocks port 5432 — try another network or hotspot.",
    "",
    `Retries used: ${CONNECT_RETRIES}, timeout per attempt: ${CONNECT_TIMEOUT_SEC}s`,
    err?.message ? `  Error: ${err.message}` : "",
    "",
  ].join("\n");
}

async function connectWithRetry(postgres) {
  let lastErr;
  for (let attempt = 1; attempt <= CONNECT_RETRIES; attempt += 1) {
    const sql = postgres(process.env.DATABASE_URL, {
      max: 1,
      ssl: { rejectUnauthorized: false },
      connect_timeout: CONNECT_TIMEOUT_SEC,
      idle_timeout: 20,
    });
    try {
      await sql`select 1 as ok`;
      if (attempt > 1) {
        console.log(`[drizzle-migrate-batched] Connected on attempt ${attempt}.`);
      }
      return sql;
    } catch (e) {
      lastErr = e;
      await sql.end({ timeout: 1 }).catch(() => {});
      if (attempt < CONNECT_RETRIES) {
        console.warn(
          `[drizzle-migrate-batched] Connect attempt ${attempt}/${CONNECT_RETRIES} failed — retry in ${CONNECT_RETRY_DELAY_MS / 1000}s…`,
        );
        await sleep(CONNECT_RETRY_DELAY_MS);
      }
    }
  }
  console.error(connectionHint(lastErr));
  throw lastErr;
}

async function main() {
  const postgresPkg = path.join(process.cwd(), "node_modules", "postgres");
  if (!fs.existsSync(postgresPkg)) {
    console.error(
      "\n[drizzle-migrate-batched] Missing dependency `postgres`. Run: npm install\n",
    );
    process.exit(1);
  }
  const postgres = (await import("postgres")).default;
  const sql = await connectWithRetry(postgres);
  const migTable = `"${SCHEMA}"."${TABLE}"`;

  try {
    await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA}"`);
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS ${migTable} (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const journal = JSON.parse(fs.readFileSync(JOURNAL_PATH, "utf8"));
    if (!journal.entries?.length) {
      throw new Error("No entries in drizzle/meta/_journal.json");
    }

    for (const entry of journal.entries) {
      const filePath = path.join(MIGRATIONS_DIR, `${entry.tag}.sql`);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing migration file: ${filePath}`);
      }
      const raw = fs.readFileSync(filePath, "utf8");
      const hash = crypto.createHash("sha256").update(raw).digest("hex");
      const stmts = raw
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean);

      const already = await sql.unsafe(
        `select 1 from ${migTable} where hash = $1 limit 1`,
        [hash],
      );
      if (already.length) {
        console.log(`[skip] ${entry.tag} (already applied)`);
        continue;
      }

      console.log(`[apply] ${entry.tag} (${stmts.length} statements)…`);
      await sql.begin(async (tx) => {
        for (const st of stmts) {
          await tx.unsafe(st);
        }
        await tx.unsafe(
          `insert into ${migTable} ("hash", "created_at") values ($1, $2)`,
          [hash, entry.when],
        );
      });
      console.log(`[ok]   ${entry.tag}`);
    }

    console.log("All migrations applied.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
