/**
 * Quick check that BINANCE_API_KEY / BINANCE_API_SECRET work (signed GET /api/v3/account).
 * Run: node --env-file=.env.local scripts/verify-binance.mjs
 */
import crypto from "node:crypto";

const BASE = process.env.BINANCE_API_BASE ?? "https://api.binance.com";
const key = process.env.BINANCE_API_KEY;
const secret = process.env.BINANCE_API_SECRET;

if (!key || !secret) {
  console.error("Set BINANCE_API_KEY and BINANCE_API_SECRET (e.g. in .env.local).");
  process.exit(1);
}

const timestamp = Date.now().toString();
const recvWindow = "5000";
const qs = new URLSearchParams({ timestamp, recvWindow }).toString();
const signature = crypto.createHmac("sha256", secret).update(qs).digest("hex");
const url = `${BASE}/api/v3/account?${qs}&signature=${signature}`;

const res = await fetch(url, {
  headers: { "X-MBX-APIKEY": key },
});

const text = await res.text();
if (!res.ok) {
  console.error("Binance API error", res.status, text);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(text);
} catch {
  console.error("Non-JSON response:", text.slice(0, 400));
  process.exit(1);
}

const canTrade = data.canTrade;
const balances = (data.balances ?? []).filter(
  (b) => Number(b.free) > 0 || Number(b.locked) > 0,
);

console.log("OK — Binance credentials are valid.");
console.log("canTrade:", canTrade);
console.log(
  "Non-zero balances (sample):",
  balances.slice(0, 5).map((b) => `${b.asset}:${b.free}`),
);
