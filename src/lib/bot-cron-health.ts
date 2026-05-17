import {
  cronIntervalMs,
  recommendedCronIntervalMs,
} from "@/lib/bot-cron-interval";
import {
  getPlatformSetting,
  PlatformSettingKey,
  setPlatformSetting,
} from "@/lib/platform-settings";

export type BotCronRunSnapshot = {
  at: string;
  instances: number;
  executed: number;
  skipped: number;
  errors: number;
  locked?: boolean;
};

export type BotCronHealth = {
  configured: boolean;
  inlineEnabled: boolean;
  intervalMs: number;
  recommendedIntervalMs: number;
  cronNeedsFasterTick: boolean;
  lastRun: BotCronRunSnapshot | null;
  stale: boolean;
  staleAfterMs: number;
};

export async function recordBotCronRun(
  out: Omit<BotCronRunSnapshot, "at"> & { at?: string },
): Promise<void> {
  const snapshot: BotCronRunSnapshot = {
    at: out.at ?? new Date().toISOString(),
    instances: out.instances,
    executed: out.executed,
    skipped: out.skipped,
    errors: out.errors,
    locked: out.locked,
  };
  await setPlatformSetting(
    PlatformSettingKey.BOTS_CRON_LAST_RUN,
    JSON.stringify(snapshot),
  );
}

export async function getBotCronHealth(opts?: {
  traderProfiles?: Array<string | undefined | null>;
}): Promise<BotCronHealth> {
  const intervalMs = cronIntervalMs();
  const recommendedIntervalMs = recommendedCronIntervalMs(
    opts?.traderProfiles ?? [],
  );
  const configured = Boolean(
    process.env.CRON_SECRET?.trim() &&
      process.env.CRON_SECRET.trim().length >= 12,
  );
  const inlineEnabled = process.env.BOT_CRON_INLINE === "1";
  const staleAfterMs = intervalMs * 2.5;

  const raw = await getPlatformSetting(PlatformSettingKey.BOTS_CRON_LAST_RUN);
  let lastRun: BotCronRunSnapshot | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as BotCronRunSnapshot;
      if (typeof parsed.at === "string") lastRun = parsed;
    } catch {
      lastRun = null;
    }
  }

  const stale =
    configured &&
    (!lastRun ||
      Date.now() - new Date(lastRun.at).getTime() > staleAfterMs);

  return {
    configured,
    inlineEnabled,
    intervalMs,
    recommendedIntervalMs,
    cronNeedsFasterTick: intervalMs > recommendedIntervalMs * 1.1,
    lastRun,
    stale,
    staleAfterMs,
  };
}
