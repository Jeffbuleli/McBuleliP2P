#!/usr/bin/env node
/** Calls POST /api/internal/game/tick on the deployed McBuleli app. */
const base = (process.env.MCBULELI_API_URL ?? "").replace(/\/$/, "");
const secret = process.env.CRON_SECRET ?? process.env.MCBULELI_CRON_SECRET ?? "";

if (!base || !secret) {
  console.error("MCBULELI_API_URL and CRON_SECRET required");
  process.exit(1);
}

const res = await fetch(`${base}/api/internal/game/tick`, {
  method: "POST",
  headers: { "x-cron-secret": secret },
});

const body = await res.text();
console.log(res.status, body);
process.exit(res.ok ? 0 : 1);
