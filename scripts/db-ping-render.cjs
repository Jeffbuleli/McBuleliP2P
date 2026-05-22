/**
 * Quick connectivity check to Render Postgres using .env.render
 * Usage: npm run db:ping:render
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

function parseDotenv(contents) {
  const out = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const body = line.startsWith("export ") ? line.slice(7).trim() : line;
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

const envFile = process.argv.includes("--env-file")
  ? process.argv[process.argv.indexOf("--env-file") + 1]
  : ".env.render";
const abs = path.join(process.cwd(), envFile);
if (!fs.existsSync(abs)) {
  console.error(`Missing ${abs}`);
  process.exit(1);
}
const parsed = parseDotenv(fs.readFileSync(abs, "utf8"));
for (const [k, v] of Object.entries(parsed)) {
  if (process.env[k] === undefined) process.env[k] = v;
}
if (!process.env.DATABASE_URL) {
  console.error(`DATABASE_URL missing in ${envFile}`);
  process.exit(1);
}

let host = "?";
try {
  host = new URL(process.env.DATABASE_URL.replace(/^postgres:/, "postgresql:"))
    .hostname;
} catch {
  // ignore
}

async function main() {
  const postgres = (await import("postgres")).default;
  const timeout = Number(process.env.DB_CONNECT_TIMEOUT_SEC || 90);
  console.log(`Pinging ${host} (timeout ${timeout}s, ssl)…`);
  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    ssl: { rejectUnauthorized: false },
    connect_timeout: timeout,
  });
  try {
    const [row] = await sql`select version() as v, now() as t`;
    console.log("OK — connected.");
    console.log(`  Time: ${row.t}`);
    console.log(`  ${String(row.v).slice(0, 80)}…`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error("FAILED —", e.code || e.message || e);
  console.error(`
Tips:
  • Render Postgres → use External Database URL in .env.render
  • Dashboard → database Available? (wake free instance first)
  • Networking → allow your IP or 0.0.0.0/0 for external access
  • Try: npm run db:ping:render  (after fixing network)
`);
  process.exit(1);
});
