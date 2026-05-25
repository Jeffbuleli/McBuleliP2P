#!/usr/bin/env node
/**
 * Render Cron — POST /api/internal/governance/tick
 * Closes expired votes and executes passed governance proposals.
 * Env: MCBULELI_API_URL (or APP_URL), CRON_SECRET (or MCBULELI_CRON_SECRET).
 */
const base = (
  process.env.MCBULELI_API_URL ??
  process.env.APP_URL ??
  "https://mcbuleli.org"
).replace(/\/$/, "");
const secret = (
  process.env.CRON_SECRET ?? process.env.MCBULELI_CRON_SECRET ?? ""
).trim();

if (!secret || secret.length < 12) {
  console.error("[cron-governance-tick] CRON_SECRET missing (min 12 chars)");
  process.exit(1);
}

const url = `${base}/api/internal/governance/tick`;
const res = await fetch(url, {
  method: "POST",
  headers: {
    "x-cron-secret": secret,
    "Content-Type": "application/json",
  },
});
const body = await res.text();
const trimmed = body.trim();
if (!res.ok) {
  console.error("[cron-governance-tick] HTTP", res.status, trimmed.slice(0, 500));
  process.exit(1);
}
console.log(trimmed);
