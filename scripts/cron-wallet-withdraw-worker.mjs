#!/usr/bin/env node
import { requireCronEnv } from "./cron-shared.mjs";

const NAME = "cron-wallet-withdraw-worker";
const { secret, base } = requireCronEnv(NAME);

const res = await fetch(`${base}/api/internal/wallet/withdraw-worker`, {
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
