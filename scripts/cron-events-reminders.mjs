#!/usr/bin/env node
const base = (
  process.env.MCBULELI_API_URL ??
  process.env.APP_URL ??
  "https://mcbuleli.org"
).replace(/\/$/, "");
const secret = (
  process.env.CRON_SECRET ?? process.env.MCBULELI_CRON_SECRET ?? ""
).trim();

if (!secret || secret.length < 12) {
  console.error("[cron-events-reminders] CRON_SECRET missing");
  process.exit(1);
}

const res = await fetch(`${base}/api/internal/events/reminders`, {
  method: "POST",
  headers: { "x-cron-secret": secret, "Content-Type": "application/json" },
});
const body = await res.text();
if (!res.ok) {
  console.error("[cron-events-reminders] HTTP", res.status, body.slice(0, 500));
  process.exit(1);
}
console.log(body);
