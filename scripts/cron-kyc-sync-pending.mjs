#!/usr/bin/env node
/**
 * Render Cron — POST /api/internal/kyc/sync-pending
 * Env: MCBULELI_API_URL (or APP_URL), CRON_SECRET (or MCBULELI_CRON_SECRET).
 * Requires METAMAP_CLIENT_SECRET on the web service.
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
  console.error("[cron-kyc-sync] CRON_SECRET missing (min 12 chars)");
  process.exit(1);
}

const url = `${base}/api/internal/kyc/sync-pending`;
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
  console.error("[cron-kyc-sync] HTTP", res.status, trimmed.slice(0, 500));
  process.exit(1);
}
console.log(trimmed);
