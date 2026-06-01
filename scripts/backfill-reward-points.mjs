#!/usr/bin/env node
/**
 * Backfill Buleli Points for users who completed actions before the rewards launch.
 *
 *   npm run db:backfill-reward-points
 *
 * Loads DATABASE_URL from .env.render if present (Render prod).
 */
import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.render");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing — set in .env.render or export DATABASE_URL");
  process.exit(1);
}

const { backfillAllUserRewardPoints } = await import(
  "../src/lib/reward-points-service.ts"
);

console.log("Backfilling Buleli Points for all eligible users…");
const out = await backfillAllUserRewardPoints();
console.log(JSON.stringify(out, null, 2));
console.log("Done.");
