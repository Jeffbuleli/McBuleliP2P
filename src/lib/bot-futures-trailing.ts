import { unrealizedProfitPct } from "@/lib/bot-futures-smart-exit";

export type TrailingState = {
  active: boolean;
  peakProfitPct: number;
  currentProfitPct: number;
  retracePct: number;
  shouldClose: boolean;
};

/** Trailing stop on unrealized profit % (peak − current ≥ trailingPct). */
export function evaluateTrailingStop(args: {
  side: "LONG" | "SHORT";
  entry: number;
  mark: number;
  trailingMode: boolean;
  trailingPct: number;
  trailingTriggerPct: number;
  storedPeakProfitPct: number | null;
}): TrailingState {
  const currentProfitPct = unrealizedProfitPct({
    side: args.side,
    entry: args.entry,
    mark: args.mark,
  });

  const base: TrailingState = {
    active: false,
    peakProfitPct: args.storedPeakProfitPct ?? currentProfitPct,
    currentProfitPct,
    retracePct: 0,
    shouldClose: false,
  };

  if (!args.trailingMode) return base;

  const peakProfitPct = Math.max(
    args.storedPeakProfitPct ?? -Infinity,
    currentProfitPct,
  );
  const active = peakProfitPct >= args.trailingTriggerPct;
  const retracePct = Math.max(0, peakProfitPct - currentProfitPct);

  return {
    active,
    peakProfitPct,
    currentProfitPct,
    retracePct,
    shouldClose:
      active &&
      retracePct >= args.trailingPct &&
      currentProfitPct > 0,
  };
}

export function peakProfitIncreased(
  stored: number | null,
  next: number,
  epsilon = 0.05,
): boolean {
  if (stored == null || !Number.isFinite(stored)) return true;
  return next > stored + epsilon;
}
