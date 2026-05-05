export const LP_POOL_DISTRIBUTION_RATE = 0.6; // 60% to LPs, 40% to insurance + treasury

export type LpPoolLockMonths = 1 | 3 | 6;

export function isAllowedLpLockMonths(v: number): v is LpPoolLockMonths {
  return v === 1 || v === 3 || v === 6;
}

export type LpPoolSizeTier = "t1" | "t2" | "t3" | "t4" | "t5";
export type LpPoolLockTier = "m1" | "m3" | "m6";

export function lockTier(months: LpPoolLockMonths): LpPoolLockTier {
  return months === 1 ? "m1" : months === 3 ? "m3" : "m6";
}

export function lockMultiplier(months: LpPoolLockMonths): number {
  // Local-friendly but still incentivizes longer locks.
  if (months === 1) return 1.0;
  if (months === 3) return 1.35;
  return 1.8;
}

export function sizeTier(amountUsdt: number): LpPoolSizeTier {
  if (amountUsdt >= 2000) return "t5";
  if (amountUsdt >= 1000) return "t4";
  if (amountUsdt >= 500) return "t3";
  if (amountUsdt >= 100) return "t2";
  return "t1";
}

export function sizeMultiplier(tier: LpPoolSizeTier): number {
  switch (tier) {
    case "t1":
      return 1.0; // 50–99
    case "t2":
      return 1.1; // 100–499
    case "t3":
      return 1.25; // 500–999
    case "t4":
      return 1.4; // 1000–1999
    case "t5":
      return 1.6; // 2000+
    default:
      return 1.0;
  }
}

export function lpPoolMinDepositUsdt(): number {
  return 50;
}

