#!/usr/bin/env node
/**
 * GitHub Actions cron - POST /api/internal/hackathon/campaign-daily-send
 * 09h00 Africa/Kinshasa = 08:00 UTC → send up to 50 partnership emails.
 * Infrequent email job → GHA (.github/workflows/cron-scheduled.yml), not VPS crontab.
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
  console.error("[cron-hackathon-lead-campaign] CRON_SECRET missing");
  process.exit(1);
}

const url = `${base}/api/internal/hackathon/campaign-daily-send`;
const res = await fetch(url, {
  method: "POST",
  headers: {
    "x-cron-secret": secret,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    // Approval is manual (admin). Cron only sends already APPROVED + dryRun=false.
    corporateOnly: true,
    limit: 50,
  }),
});
const body = await res.text();
if (!res.ok) {
  console.error("[cron-hackathon-lead-campaign] HTTP", res.status, body.slice(0, 800));
  process.exit(1);
}
console.log(body);
