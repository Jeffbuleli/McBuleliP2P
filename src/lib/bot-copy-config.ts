/** Strategy fields copied from lead; sizing fields scaled by ratio. */
const SIZING_NUMERIC_KEYS = [
  "marginUsdt",
  "quoteAmountUsdt",
  "quotePerLevelUsdt",
  "gridQuotePerLevelUsdt",
] as const;

function scaleNumericString(raw: unknown, ratio: number, min: number): string | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return String(Math.max(min, raw * ratio));
  }
  if (typeof raw === "string") {
    const n = parseFloat(raw.trim().replace(",", "."));
    if (Number.isFinite(n)) return String(Math.max(min, n * ratio));
  }
  return undefined;
}

/** Merge lead strategy into follower config with proportional sizing. */
export function mergeLeadConfigForCopy(
  leadConfig: Record<string, unknown>,
  followerConfig: Record<string, unknown>,
  sizingRatio: number,
): Record<string, unknown> {
  const ratio = Math.min(1, Math.max(0.1, sizingRatio));
  const merged: Record<string, unknown> = { ...followerConfig, ...leadConfig };

  for (const key of SIZING_NUMERIC_KEYS) {
    const scaled = scaleNumericString(merged[key], ratio, key.includes("margin") ? 5 : 10);
    if (scaled) merged[key] = scaled;
  }

  return merged;
}
