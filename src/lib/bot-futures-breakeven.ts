import { unrealizedProfitPct } from "@/lib/bot-futures-smart-exit";

/** Whether software SL should be at entry (0% from entry) instead of stopLossPct. */
export function isBreakevenArmed(args: {
  side: "LONG" | "SHORT";
  entry: number;
  mark: number;
  breakevenMode: boolean;
  breakevenTriggerPct: number;
  latched: boolean;
}): boolean {
  if (!args.breakevenMode) return false;
  if (args.latched) return true;
  const profitPct = unrealizedProfitPct({
    side: args.side,
    entry: args.entry,
    mark: args.mark,
  });
  return profitPct >= args.breakevenTriggerPct;
}

export function shouldClosePosition(args: {
  side: "LONG" | "SHORT";
  entry: number;
  mark: number;
  stopLossPct: number;
  takeProfitPct: number;
  breakevenArmed: boolean;
}): "sl" | "tp" | null {
  const { side, entry, mark, stopLossPct, takeProfitPct, breakevenArmed } = args;
  if (!Number.isFinite(entry) || entry <= 0) return null;

  if (side === "LONG") {
    if (breakevenArmed) {
      if (mark <= entry) return "sl";
    } else if (mark <= entry * (1 - stopLossPct / 100)) {
      return "sl";
    }
    if (mark >= entry * (1 + takeProfitPct / 100)) return "tp";
  } else {
    if (breakevenArmed) {
      if (mark >= entry) return "sl";
    } else if (mark >= entry * (1 + stopLossPct / 100)) {
      return "sl";
    }
    if (mark <= entry * (1 - takeProfitPct / 100)) return "tp";
  }
  return null;
}
