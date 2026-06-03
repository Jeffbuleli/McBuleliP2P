#!/usr/bin/env node
/**
 * Render Cron — POST /api/internal/academy/journey-nudge (P1b progression emails)
 * Env: MCBULELI_API_URL, CRON_SECRET, RESEND_ALLOW_SEND=true
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
  console.error("[cron-academy-journey-nudge] CRON_SECRET missing");
  process.exit(1);
}

const url = `${base}/api/internal/academy/journey-nudge`;
const res = await fetch(url, {
  method: "POST",
  headers: { "x-cron-secret": secret, "Content-Type": "application/json" },
});
const body = await res.text();
if (!res.ok) {
  console.error("[cron-academy-journey-nudge] HTTP", res.status, body.slice(0, 500));
  process.exit(1);
}
console.log(body.trim());
