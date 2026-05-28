#!/usr/bin/env node
const base = (
  process.env.MCBULELI_API_URL ??
  process.env.APP_URL ??
  "https://mcbuleli.org"
).replace(/\/$/, "");
const secret = (
  process.env.WALLET_CRON_SECRET ??
  process.env.CRON_SECRET ??
  process.env.MCBULELI_CRON_SECRET ??
  ""
).trim();

if (!secret || secret.length < 12) {
  console.error("[cron-wallet-deposit-scan] missing WALLET_CRON_SECRET/CRON_SECRET");
  process.exit(1);
}

const res = await fetch(`${base}/api/internal/wallet/deposit-scan`, {
  method: "POST",
  headers: {
    "x-cron-secret": secret,
    "Content-Type": "application/json",
  },
});
const text = await res.text();
if (!res.ok) {
  const detail = text.trim() || "(empty body)";
  console.error("[cron-wallet-deposit-scan] HTTP", res.status, detail.slice(0, 800));
  process.exit(1);
}
console.log(text.trim());
