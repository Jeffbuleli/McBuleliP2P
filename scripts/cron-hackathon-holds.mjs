#!/usr/bin/env node
/**
 * Cron - POST /api/internal/hackathon/holds
 * Hourly: payment reminders every 24h for reserved seats (no auto-expiry).
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
  console.error("[cron-hackathon-holds] CRON_SECRET missing (min 12 chars)");
  process.exit(1);
}

const url = `${base}/api/internal/hackathon/holds`;
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
  console.error("[cron-hackathon-holds] HTTP", res.status, trimmed.slice(0, 500));
  process.exit(1);
}
console.log(trimmed);
