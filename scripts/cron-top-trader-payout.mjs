#!/usr/bin/env node
/**
 * Render Cron — POST /api/internal/community/top-trader-payout
 * Sunday 01:00 UTC — weekly Top Trader prize (10 USDT).
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
  console.error("[cron-top-trader-payout] CRON_SECRET missing (min 12 chars)");
  process.exit(1);
}

const url = `${base}/api/internal/community/top-trader-payout`;
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
  console.error("[cron-top-trader-payout] HTTP", res.status, trimmed.slice(0, 500));
  process.exit(1);
}
console.log(trimmed);
