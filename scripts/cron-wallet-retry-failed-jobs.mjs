#!/usr/bin/env node
import { cronApiBase, requireCronSecret } from "./cron-shared.mjs";

const NAME = "cron-wallet-retry-failed-jobs";
const secret = requireCronSecret(NAME);
const base = cronApiBase();

const res = await fetch(`${base}/api/internal/wallet/retry-failed-jobs`, {
  method: "POST",
  headers: {
    "x-cron-secret": secret,
    "Content-Type": "application/json",
  },
});
const text = await res.text();
if (!res.ok) {
  const detail = text.trim() || "(empty body)";
  console.error(`[${NAME}] HTTP`, res.status, detail.slice(0, 800));
  process.exit(1);
}
console.log(text.trim());
