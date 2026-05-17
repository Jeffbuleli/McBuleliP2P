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
  lastRun: BotCronRunSnapshot | null;
  stale: boolean;
  staleAfterMs: number;
};

function cronIntervalMs(): number {
  const n = Number(process.env.BOT_CRON_INTERVAL_MS ?? "300000");
  if (!Number.isFinite(n) || n < 60_000) return 300_000;
  return n;
}

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

export async function getBotCronHealth(): Promise<BotCronHealth> {
  const intervalMs = cronIntervalMs();
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
    lastRun,
    stale,
    staleAfterMs,
  };
}
