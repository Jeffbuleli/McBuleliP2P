/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

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
    throw new Error(
      `Missing env file: ${abs}\nCreate it with:\n  DATABASE_URL=postgresql://...`,
    );
  }
  const parsed = parseDotenv(fs.readFileSync(abs, "utf8"));
  for (const [k, v] of Object.entries(parsed)) {
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

const args = process.argv.slice(2);
let envFile = ".env.render";
let i = 0;
while (i < args.length) {
  if (args[i] === "--env-file") {
    envFile = args[i + 1];
    if (!envFile) throw new Error("--env-file requires a path");
    i += 2;
    continue;
  }
  i += 1;
}

loadEnvFile(envFile);

if (!process.env.DATABASE_URL) {
  throw new Error(
    `DATABASE_URL is missing after loading ${envFile}.\nAdd:\n  DATABASE_URL=postgresql://...`,
  );
}

const drizzleBin = path.join(
  process.cwd(),
  "node_modules",
  "drizzle-kit",
  "bin.cjs",
);

/** Pipe stdio so the progress UI does not hide thrown errors in some terminals. */
const res = spawnSync(
  process.execPath,
  [drizzleBin, "migrate", "--config=drizzle.config.ts"],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CI: "1",
      TERM: "dumb",
      NO_COLOR: "1",
      FORCE_COLOR: "0",
    },
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  },
);

if (res.stdout) process.stdout.write(res.stdout);
if (res.stderr) process.stderr.write(res.stderr);

if ((res.status ?? 1) !== 0) {
  process.stderr.write(
    `\n[drizzle-migrate-render] exit ${res.status}. DATABASE_URL db=${new URL(process.env.DATABASE_URL).pathname.slice(1) || "(none)"}\n`,
  );
}

process.exit(res.status ?? 1);
