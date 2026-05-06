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

async function main() {
  const postgres = (await import("postgres")).default;
  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    ssl: "require",
  });
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
