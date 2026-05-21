import { getLatestExecutionLogAt } from "@/lib/bot-instance-service";

/** Log actions that close a futures bot position (for re-entry cooldown). */
export const FUTURES_OPEN_LOG_ACTION = "futures_open" as const;

/** Log actions that close a futures bot position (for re-entry cooldown). */
export const FUTURES_CLOSE_LOG_ACTIONS = [
  "futures_trailing_close",
  "futures_sl_close",
  "futures_tp_close",
  "futures_smart_close",
  "futures_max_hold_close",
] as const;

export function evaluateMaxHold(args: {
  maxHoldMinutes: number;
  positionOpenedAt: Date | null;
}): { shouldClose: boolean; heldMinutes: number } {
  if (args.maxHoldMinutes <= 0 || !args.positionOpenedAt) {
    return { shouldClose: false, heldMinutes: 0 };
  }
  const heldMinutes =
    (Date.now() - args.positionOpenedAt.getTime()) / 60_000;
  return {
    shouldClose: heldMinutes >= args.maxHoldMinutes,
    heldMinutes,
  };
}

export function isInReentryCooldown(args: {
  reentryCooldownMinutes: number;
  lastCloseAt: Date | null;
}): { blocked: boolean; remainingMinutes: number } {
  if (args.reentryCooldownMinutes <= 0 || !args.lastCloseAt) {
    return { blocked: false, remainingMinutes: 0 };
  }
  const cooldownMs = args.reentryCooldownMinutes * 60_000;
  const elapsedMs = Date.now() - args.lastCloseAt.getTime();
  if (elapsedMs >= cooldownMs) {
    return { blocked: false, remainingMinutes: 0 };
  }
  return {
    blocked: true,
    remainingMinutes: Math.ceil((cooldownMs - elapsedMs) / 60_000),
  };
}

/** Min time between new futures entries (uses last open only — not closes or cron ticks). */
export async function getFuturesEntryIntervalBlock(args: {
  instanceId: string;
  intervalHours: number;
}): Promise<{
  blocked: boolean;
  remainingMinutes: number;
  lastEntryAt: Date | null;
}> {
  const lastEntryAt = await getLatestExecutionLogAt(
    args.instanceId,
    [FUTURES_OPEN_LOG_ACTION],
    30 * 24 * 60 * 60 * 1000,
  );
  const intervalMs = args.intervalHours * 60 * 60 * 1000;
  if (!lastEntryAt) {
    return { blocked: false, remainingMinutes: 0, lastEntryAt: null };
  }
  const elapsedMs = Date.now() - lastEntryAt.getTime();
  if (elapsedMs >= intervalMs) {
    return { blocked: false, remainingMinutes: 0, lastEntryAt };
  }
  return {
    blocked: true,
    remainingMinutes: Math.ceil((intervalMs - elapsedMs) / 60_000),
    lastEntryAt,
  };
}
