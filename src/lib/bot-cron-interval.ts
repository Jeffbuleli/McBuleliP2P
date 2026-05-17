/** Global bot tick interval from env (inline cron or external ping). */
export const BOT_CRON_DEFAULT_INTERVAL_MS = 300_000;
export const BOT_CRON_MIN_INTERVAL_MS = 60_000;
export const BOT_SCALP_RECOMMENDED_INTERVAL_MS = 60_000;

export function cronIntervalMs(): number {
  const n = Number(process.env.BOT_CRON_INTERVAL_MS ?? String(BOT_CRON_DEFAULT_INTERVAL_MS));
  if (!Number.isFinite(n) || n < BOT_CRON_MIN_INTERVAL_MS) {
    return BOT_CRON_DEFAULT_INTERVAL_MS;
  }
  return n;
}

export function recommendedCronIntervalMs(
  traderProfiles: Array<string | undefined | null>,
): number {
  if (traderProfiles.some((p) => p === "scalp")) {
    return BOT_SCALP_RECOMMENDED_INTERVAL_MS;
  }
  return cronIntervalMs();
}
