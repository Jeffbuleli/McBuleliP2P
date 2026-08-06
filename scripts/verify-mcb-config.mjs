/**
 * McB Voie A — verify env + optional BscScan contract check.
 * Run: npm run verify:mcb
 * Or:  node --env-file=.env scripts/verify-mcb-config.mjs
 */
const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

function envTruthy(v) {
  return v === "true" || v === "1";
}

function ok(msg) {
  console.log(`  ✅ ${msg}`);
}
function warn(msg) {
  console.warn(`  ⚠️  ${msg}`);
}
function fail(msg) {
  console.error(`  ❌ ${msg}`);
}

const contract = process.env.MCB_TOKEN_CONTRACT?.trim() ?? "";
const claimEnabled = envTruthy(process.env.MCB_CLAIM_ENABLED);
const buildersEnabled = envTruthy(process.env.BUILDERS_PROGRAM_ENABLED);
const adsEnabled = envTruthy(process.env.COMMUNITY_ADS_ENABLED);
const mcbUsdRate =
  process.env.MCB_USD_RATE?.trim() ||
  process.env.MCB_USD_TWAP?.trim() ||
  process.env.BUILDERS_MCB_USD_RATE?.trim() ||
  "";
const treasury =
  process.env.MCB_BUILDERS_TREASURY?.trim() ||
  process.env.MCB_TREASURY_ADDRESS?.trim() ||
  "";
const poolCap = process.env.MCB_CLAIM_POOL_CAP_MCB?.trim() || "40000000";
const monthlyCap = process.env.MCB_CLAIM_MONTHLY_GLOBAL_CAP_MCB?.trim() || "0";

console.log("\nMcB Voie A — configuration check\n");
console.log("Doc: docs/mcb-voie-a-runbook.md\n");

let errors = 0;
let warnings = 0;

// A1 — contract
if (!contract) {
  fail("MCB_TOKEN_CONTRACT not set — complete A1 (BSC deploy) first");
  errors++;
} else if (!ADDR_RE.test(contract)) {
  fail(`MCB_TOKEN_CONTRACT invalid format: ${contract}`);
  errors++;
} else {
  ok(`MCB_TOKEN_CONTRACT = ${contract}`);
  console.log(`     BscScan: https://bscscan.com/token/${contract}`);
}

// A3 — rates & treasury
if (!mcbUsdRate) {
  warn("MCB_USD_RATE not set — Builders quotes will show null McB amount");
  warnings++;
} else {
  const n = Number(mcbUsdRate);
  if (!Number.isFinite(n) || n <= 0) {
    fail(`MCB_USD_RATE invalid: ${mcbUsdRate}`);
    errors++;
  } else {
    ok(`MCB_USD_RATE = ${n} USD/McB`);
  }
}

if (!treasury) {
  warn("MCB_BUILDERS_TREASURY not set — required before A6");
  warnings++;
} else if (!ADDR_RE.test(treasury)) {
  fail(`MCB_BUILDERS_TREASURY invalid: ${treasury}`);
  errors++;
} else {
  ok(`MCB_BUILDERS_TREASURY = ${treasury}`);
}

// Flags
console.log("\nFeature flags:");
console.log(`  MCB_CLAIM_ENABLED        = ${claimEnabled}`);
console.log(`  BUILDERS_PROGRAM_ENABLED = ${buildersEnabled}`);
console.log(`  COMMUNITY_ADS_ENABLED    = ${adsEnabled}`);
console.log(`  MCB_CLAIM_POOL_CAP_MCB   = ${poolCap}`);
console.log(`  MCB_CLAIM_MONTHLY_GLOBAL = ${monthlyCap || "0 (off)"}`);

if (claimEnabled && !contract) {
  fail("MCB_CLAIM_ENABLED=true but no contract — dangerous");
  errors++;
}
if (claimEnabled && contract) {
  ok("Claim portal can accept requests (ensure hot wallet funded — A2/A4)");
}
if (buildersEnabled && !mcbUsdRate) {
  fail("BUILDERS_PROGRAM_ENABLED=true but MCB_USD_RATE missing");
  errors++;
}
if (adsEnabled && !contract) {
  warn("COMMUNITY_ADS_ENABLED=true without on-chain McB — custodial only until settlement");
  warnings++;
}

// Voie A phase hint
console.log("\nVoie A progress hint:");
if (!contract) {
  console.log("  → Current step: A1 Deploy BSC mainnet");
} else if (!claimEnabled) {
  console.log("  → Current step: A2–A3 treasury + Render env (claim still OFF)");
} else if (!buildersEnabled) {
  console.log("  → Current step: A4 pilot claim running — then A5 liquidity");
} else {
  console.log("  → A6+ — monitor claims, Builders, Ads");
}

async function bscScanCheck() {
  if (!contract || !ADDR_RE.test(contract)) return;
  console.log("\nBscScan (public API):");
  try {
    const url = `https://api.bscscan.com/api?module=contract&action=getabi&address=${contract}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "1" && data.result && data.result !== "Contract source code not verified") {
      ok("Contract ABI available (likely verified)");
    } else {
      warn("Contract not verified on BscScan yet — complete A1.7");
      warnings++;
    }
  } catch {
    warn("Could not reach BscScan API (network) — check manually");
    warnings++;
  }

  try {
    const url = `https://api.bscscan.com/api?module=stats&action=tokensupply&contractaddress=${contract}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "1" && data.result) {
      const raw = BigInt(data.result);
      const human = Number(raw) / 1e18;
      ok(`On-chain totalSupply ≈ ${human.toLocaleString()} McB`);
    }
  } catch {
    /* optional */
  }
}

await bscScanCheck();

console.log("\n── Summary ──");
if (errors > 0) {
  console.error(`${errors} error(s), ${warnings} warning(s) — fix before enabling claims in prod.\n`);
  process.exit(1);
}
if (warnings > 0) {
  console.warn(`${warnings} warning(s) — OK for early A1–A3 setup.\n`);
} else {
  console.log("All checks passed.\n");
}
