/**
 * Shared env for Render / local cron scripts calling /api/internal/*.
 */

export function cronApiBase() {
  return (
    process.env.MCBULELI_API_URL ??
    process.env.APP_URL ??
    "https://mcbuleli.org"
  ).replace(/\/$/, "");
}

export function readCronSecret() {
  return (
    process.env.WALLET_CRON_SECRET ??
    process.env.CRON_SECRET ??
    process.env.MCBULELI_CRON_SECRET ??
    ""
  ).trim();
}

/**
 * @param {string} scriptName e.g. cron-wallet-retry-failed-jobs
 */
export function requireCronSecret(scriptName) {
  const secret = readCronSecret();
  if (secret.length >= 12) return secret;

  const apiUrl = cronApiBase();
  console.error(`[${scriptName}] missing CRON_SECRET (min 12 chars)`);
  console.error("");
  console.error("Render fix — open this Cron Job → Environment, add:");
  console.error("  CRON_SECRET        = same value as your McBuleli Web service");
  console.error(`  MCBULELI_API_URL   = ${apiUrl}`);
  console.error("");
  console.error("Also set CRON_SECRET on the Web service if missing.");
  console.error("All wallet crons (deposit-scan, withdraw-worker, retry-jobs) need the same pair.");
  console.error("");
  console.error("Generate: openssl rand -base64 24");
  process.exit(1);
}

export function requireCronEnv(scriptName) {
  const secret = requireCronSecret(scriptName);
  const base = cronApiBase();
  if (!base.startsWith("http")) {
    console.error(`[${scriptName}] invalid MCBULELI_API_URL: ${base}`);
    process.exit(1);
  }
  return { secret, base };
}
