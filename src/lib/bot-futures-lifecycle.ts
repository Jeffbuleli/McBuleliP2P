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
