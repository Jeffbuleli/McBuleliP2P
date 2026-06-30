/**
 * Custodial fixed-term staking — APR is fixed at subscription (industry-standard practice).
 * Optional env overrides:
 *   STAKING_MIN_USDT, STAKING_MIN_PI
 *   STAKING_USDT_TERMS='[{"days":30,"apr":4.5},{"days":90,"apr":7}]'
 *   STAKING_PI_TERMS='[{"days":30,"apr":3},…]'
 */

export type StakingChainAsset = "USDT" | "PI";

export type StakingTerm = { days: number; aprPercent: number };

const DEFAULT_USDT: StakingTerm[] = [
  { days: 30, aprPercent: 6 },
  { days: 90, aprPercent: 9 },
  { days: 180, aprPercent: 12 },
];

const DEFAULT_PI: StakingTerm[] = [
  { days: 30, aprPercent: 4 },
  { days: 90, aprPercent: 6.5 },
  { days: 180, aprPercent: 9 },
];

function parseTermsJson(raw: string | undefined, fallback: StakingTerm[]): StakingTerm[] {
  if (!raw?.trim()) return fallback;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return fallback;
    const out: StakingTerm[] = [];
    for (const row of v) {
      if (
        row &&
        typeof row === "object" &&
        "days" in row &&
        "apr" in row &&
        typeof (row as { days: unknown }).days === "number" &&
        typeof (row as { apr: unknown }).apr === "number"
      ) {
        out.push({ days: (row as { days: number }).days, aprPercent: (row as { apr: number }).apr });
      }
    }
    return out.length ? out : fallback;
  } catch {
    return fallback;
  }
}

export function stakingMinPrincipal(asset: StakingChainAsset): number {
  const v =
    asset === "USDT"
      ? Number(process.env.STAKING_MIN_USDT ?? "10")
      : Number(process.env.STAKING_MIN_PI ?? "50");
  return Number.isFinite(v) && v > 0 ? v : asset === "USDT" ? 10 : 50;
}

export function stakingTermsFor(asset: StakingChainAsset): StakingTerm[] {
  if (asset === "USDT") {
    return parseTermsJson(process.env.STAKING_USDT_TERMS, DEFAULT_USDT);
  }
  return parseTermsJson(process.env.STAKING_PI_TERMS, DEFAULT_PI);
}

export function aprForTerm(asset: StakingChainAsset, termDays: number): number | null {
  const t = stakingTermsFor(asset).find((x) => x.days === termDays);
  return t ? t.aprPercent : null;
}

export function isAllowedStakingTerm(asset: StakingChainAsset, termDays: number): boolean {
  return stakingTermsFor(asset).some((x) => x.days === termDays);
}
