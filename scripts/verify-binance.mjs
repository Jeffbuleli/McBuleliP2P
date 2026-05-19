/**
 * Quick check that BINANCE_API_KEY / BINANCE_API_SECRET work (signed GET /api/v3/account).
 * Run from repo root: npm run verify:binance
 * Or: node --env-file=.env scripts/verify-binance.mjs
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

/** Binance keys are usually 64 chars; truncated .env lines often fail with -2015. */
function warnIfKeyShapeLooksWrong() {
  const issues = [];
  if (key.length < 60 || key.length > 70) {
    issues.push(`BINANCE_API_KEY length is ${key.length} (expected ~64 on one line).`);
  }
  if (secret.length < 60 || secret.length > 70) {
    issues.push(`BINANCE_API_SECRET length is ${secret.length} (expected ~64 on one line).`);
  }
  if (issues.length) {
    console.error("\n⚠️  Key shape looks wrong in .env:");
    for (const line of issues) console.error("   ", line);
    console.error(
      "   Paste each key from binance.com → API Management on a SINGLE line (no line break, no # comment in the middle).",
    );
    console.error(
      "   If you redacted the file with #.....suffix lines, restore the full key from Binance.\n",
    );
  }
}
warnIfKeyShapeLooksWrong();

console.log("API host:", BASE);
console.log("Key prefix:", `${key.slice(0, 8)}… (${key.length} chars)`);
console.log("Secret length:", `${secret.length} chars (must match what Binance showed once at key creation)`);

try {
  const ipRes = await fetch("https://api.ipify.org?format=json", {
    signal: AbortSignal.timeout(8000),
  });
  const ipJson = await ipRes.json();
  if (ipJson?.ip) {
    console.log(
      "Your public IP (add to Binance API whitelist if “Restrict access to trusted IPs” is ON):",
      ipJson.ip,
    );
  }
} catch {
  console.log("Could not detect public IP — check https://ifconfig.me and whitelist on Binance.");
}

const recvWindow = process.env.BINANCE_RECV_WINDOW?.trim() || "60000";

const params = {
  recvWindow,
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
  if (text.includes("-2015")) {
    console.error(`
-2015 on Spot /api/v3/account — usual causes (in order):

  A) IP WHITELIST (most common locally)
     Binance → API Management → your key → “Restrict access to trusted IPs”
     → add the public IP printed above (Mac). For Render prod, add Render outbound IP too.
     Or turn OFF IP restriction temporarily to test.

  B) WRONG OR OLD SECRET
     The secret is shown only once when you create the key. You cannot recover it.
     If you only kept the first 64 characters, create a NEW API key on binance.com and
     paste BOTH key + secret into .env in one line each.

  C) KEY ≠ BOT LIVE KEYS
     Bots store keys in the database (what you pasted in the app). .env is separate.
     Use the exact same pair in both places, or create one dedicated “McBuleli platform” key.

  D) DEMO vs LIVE
     Keys from demo.binance.com need: BINANCE_ENV=demo in .env
     Keys from binance.com need: api.binance.com (default) — no BINANCE_ENV=demo
`);
    if (BASE.includes("api.binance.com") && !BASE.includes("demo")) {
      console.error(
        "  Tip: If this key was created on demo.binance.com, add BINANCE_ENV=demo to .env and retry.\n",
      );
    }
  }
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

console.log("OK — Binance Spot credentials are valid (same check as BOT LIVE).");
console.log("canTrade:", canTrade);
console.log(
  "Non-zero balances (sample):",
  balances.slice(0, 5).map((b) => `${b.asset}:${b.free}`),
);

function signedQuery(extra = {}) {
  const p = {
    recvWindow,
    timestamp: Date.now().toString(),
    ...extra,
  };
  const q = Object.keys(p)
    .sort()
    .map((k) => `${k}=${p[k]}`)
    .join("&");
  const sig = crypto.createHmac("sha256", secret).update(q).digest("hex");
  return `${q}&signature=${sig}`;
}

const restrictionsQs = signedQuery();
const restrictionsUrl = `${BASE}/sapi/v1/account/apiRestrictions?${restrictionsQs}`;
const restrictionsRes = await fetch(restrictionsUrl, {
  headers: { "X-MBX-APIKEY": key },
});
const restrictionsText = await restrictionsRes.text();
let restrictions = null;
try {
  restrictions = JSON.parse(restrictionsText);
} catch {
  /* ignore */
}

if (restrictionsRes.ok && restrictions) {
  console.log("\nAPI restrictions (platform wallet):");
  console.log("  enableReading:", restrictions.enableReading);
  console.log("  enableWithdrawals:", restrictions.enableWithdrawals);
  console.log("  ipRestrict:", restrictions.ipRestrict);
  if (!restrictions.enableWithdrawals) {
    console.warn(
      "\n⚠️  enableWithdrawals is OFF — USDT deposit addresses need Wallet API access.",
    );
    console.warn(
      "    BOT LIVE only tests Spot/Futures. Enable Withdrawals on this key at binance.com → API Management,",
    );
    console.warn("    or use a dedicated platform key in BINANCE_API_* with Reading + Withdrawals.");
  }
} else {
  console.warn("\nCould not read apiRestrictions:", restrictionsRes.status, restrictionsText.slice(0, 200));
}

const depositQs = signedQuery({ coin: "USDT", network: "TRX" });
const depositUrl = `${BASE}/sapi/v1/capital/deposit/address?${depositQs}`;
const depositRes = await fetch(depositUrl, { headers: { "X-MBX-APIKEY": key } });
const depositText = await depositRes.text();
if (depositRes.ok) {
  console.log("\nOK — Wallet deposit address (USDT TRC20) can be generated.");
} else {
  console.error("\nWallet deposit address FAILED:", depositRes.status, depositText.slice(0, 300));
  process.exit(1);
}
