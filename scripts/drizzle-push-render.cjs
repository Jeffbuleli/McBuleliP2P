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
const drizzleArgs = [];
let i = 0;
while (i < args.length) {
  const a = args[i];
  if (a === "--") {
    drizzleArgs.push(...args.slice(i + 1));
    break;
  }
  if (a === "--env-file") {
    envFile = args[i + 1];
    if (!envFile) throw new Error("--env-file requires a path");
    i += 2;
    continue;
  }
  drizzleArgs.push(a);
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

const childArgs = [
  drizzleBin,
  "push",
  "--dialect=postgresql",
  "--schema=./src/db/schema.ts",
  "--url",
  process.env.DATABASE_URL,
  ...drizzleArgs,
];

/** Non-TTY + plain logs so drizzle-kit prints errors instead of hiding them behind the spinner. */
const childEnv = {
  ...process.env,
  CI: "1",
  TERM: "dumb",
  NO_COLOR: "1",
  FORCE_COLOR: "0",
};

const res = spawnSync(process.execPath, childArgs, {
  encoding: "utf8",
  env: childEnv,
  maxBuffer: 50 * 1024 * 1024,
});

if (res.stdout) process.stdout.write(res.stdout);
if (res.stderr) process.stderr.write(res.stderr);

if ((res.status ?? 1) !== 0) {
  process.stderr.write(
    `\n[drizzle-push-render] exited with code ${res.status}. Full DATABASE_URL length=${String(process.env.DATABASE_URL).length}\n`,
  );
}

process.exit(res.status ?? 1);
