#!/usr/bin/env node
/**
 * Render Cron Job entrypoint — POST /api/internal/bots/tick (same as trigger-bots-tick.sh).
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
const trimmed = body.trim();
if (!res.ok) {
  console.error("[cron-bots-tick] HTTP", res.status, trimmed.slice(0, 500));
  process.exit(1);
}
if (trimmed.startsWith("<") || trimmed.startsWith("<!")) {
  console.error(
    "[cron-bots-tick] Expected JSON from POST /api/internal/bots/tick but got HTML.",
    "Check MCBULELI_API_URL (https://mcbuleli.org) and CRON_SECRET on the Web service.",
    trimmed.slice(0, 200),
  );
  process.exit(1);
}
let json;
try {
  json = JSON.parse(trimmed);
} catch {
  console.error("[cron-bots-tick] Invalid JSON:", trimmed.slice(0, 300));
  process.exit(1);
}
console.log(JSON.stringify(json));
