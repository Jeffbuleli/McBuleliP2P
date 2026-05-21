#!/usr/bin/env node
/**
 * Render Cron Job entrypoint — POST /api/internal/bots/tick (same as trigger-bots-tick.sh).
 * Env: MCBULELI_API_URL (or APP_URL), CRON_SECRET (or MCBULELI_CRON_SECRET).
 */
const base = (
  process.env.MCBULELI_API_URL ??
  process.env.APP_URL ??
  "https://www.mcbuleli.online"
).replace(/\/$/, "");
const secret = (
  process.env.CRON_SECRET ?? process.env.MCBULELI_CRON_SECRET ?? ""
).trim();

if (!secret || secret.length < 12) {
  console.error("[cron-bots-tick] CRON_SECRET missing (min 12 chars)");
  process.exit(1);
}

const url = `${base}/api/internal/bots/tick`;
const res = await fetch(url, {
  method: "POST",
  headers: {
    "x-cron-secret": secret,
    "Content-Type": "application/json",
  },
});
const body = await res.text();
if (!res.ok) {
  console.error("[cron-bots-tick] HTTP", res.status, body.slice(0, 500));
  process.exit(1);
}
console.log(body);
