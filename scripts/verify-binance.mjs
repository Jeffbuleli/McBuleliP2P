/**
 * Quick check that BINANCE_API_KEY / BINANCE_API_SECRET work (signed GET /api/v3/account).
 * Run: node --env-file=.env scripts/verify-binance.mjs
 *
 * Query string must be alphabetically sorted (Binance HMAC rule).
 */
import crypto from "node:crypto";

function walletBase() {
  const explicit = (process.env.BINANCE_ENV ?? "").trim().toLowerCase();
  if (explicit === "demo" || explicit === "testnet") {
    return "https://demo-api.binance.com";
  }
  if (explicit === "live" || explicit === "production" || explicit === "prod") {
    return "https://api.binance.com";
  }
  const testnet = (process.env.BINANCE_TESTNET ?? "").trim().toLowerCase();
  if (testnet === "1" || testnet === "true" || testnet === "yes") {
    return "https://demo-api.binance.com";
  }
  const override = process.env.BINANCE_API_BASE?.trim();
  if (override) return override.replace(/\/+$/, "");
  return "https://api.binance.com";
}

const BASE = walletBase();
const key = process.env.BINANCE_API_KEY?.trim();
const secret = process.env.BINANCE_API_SECRET?.trim();

if (!key || !secret) {
  console.error("Set BINANCE_API_KEY and BINANCE_API_SECRET (e.g. in .env).");
  process.exit(1);
}

const params = {
  recvWindow: "5000",
  timestamp: Date.now().toString(),
};
const qs = Object.keys(params)
  .sort()
  .map((k) => `${k}=${params[k]}`)
  .join("&");
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
