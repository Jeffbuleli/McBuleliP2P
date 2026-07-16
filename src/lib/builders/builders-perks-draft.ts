/**
 * Draft MBP perk numbers — NOT applied to live fee quotes until finance signs.
 * Source of truth for product: docs/builders-perks-economics.md
 */
import type { BuildersTier } from "@/lib/builders/builders-config";

/** Relative discount on fee rate (0.15 = −15% of the rate). */
export type BuildersFeeDiscountDraft = {
  fiatMmRel: number;
  swapStandardRel: number;
  swapFiatToCryptoRel: number;
  /** Absolute USDT off the flat withdraw fee (baseline 2). */
  withdrawUsdtOff: number;
  /** Absolute bps off futures per side (baseline 5). */
  futuresBpsOff: number;
  /** Soft annual CAP of platform fee revenue forgone (USD estimate). */
  annualFeeCapUsd: { min: number; max: number };
};

export const BUILDERS_FEE_DISCOUNT_DRAFT: Record<
  BuildersTier,
  BuildersFeeDiscountDraft
> = {
  bronze: {
    fiatMmRel: 0,
    swapStandardRel: 0.05,
    swapFiatToCryptoRel: 0,
    withdrawUsdtOff: 0,
    futuresBpsOff: 0,
    annualFeeCapUsd: { min: 8, max: 12 },
  },
  silver: {
    fiatMmRel: 0.05,
    swapStandardRel: 0.1,
    swapFiatToCryptoRel: 0.1,
    withdrawUsdtOff: 0,
    futuresBpsOff: 0,
    annualFeeCapUsd: { min: 25, max: 40 },
  },
  gold: {
    fiatMmRel: 0.15,
    swapStandardRel: 0.15,
    swapFiatToCryptoRel: 0.15,
    withdrawUsdtOff: 0.25,
    futuresBpsOff: 1,
    annualFeeCapUsd: { min: 90, max: 120 },
  },
  diamond: {
    fiatMmRel: 0.2,
    swapStandardRel: 0.2,
    swapFiatToCryptoRel: 0.2,
    withdrawUsdtOff: 0.4,
    futuresBpsOff: 1.5,
    annualFeeCapUsd: { min: 200, max: 280 },
  },
  platinum: {
    fiatMmRel: 0.25,
    swapStandardRel: 0.25,
    swapFiatToCryptoRel: 0.25,
    withdrawUsdtOff: 0.5,
    futuresBpsOff: 2,
    annualFeeCapUsd: { min: 350, max: 450 },
  },
};

/** Absolute fee floors — never go below (platform margin). */
export const BUILDERS_FEE_FLOORS = {
  fiatMmRate: 0.035,
  swapStandardRate: 0.007,
  swapFiatToCryptoRate: 0.0175,
  withdrawUsdt: 1.5,
  futuresBpsPerSide: 3,
} as const;

export type BuildersSoftPerksDraft = {
  support: "standard_plus" | "priority" | "concierge";
  salon: boolean;
  boostPerDay: number;
  boostActiveMax: number;
  academySoft: boolean;
  betaSug: boolean;
  privateEvents: boolean;
  earlyCreatorAds: boolean;
  councilSoftVote: boolean;
  /** Soft gate for Ambassadeur charter application. */
  ambassadorEligible: boolean;
};

export const BUILDERS_SOFT_PERKS_DRAFT: Record<
  BuildersTier,
  BuildersSoftPerksDraft
> = {
  bronze: {
    support: "standard_plus",
    salon: false,
    boostPerDay: 3,
    boostActiveMax: 1,
    academySoft: false,
    betaSug: false,
    privateEvents: false,
    earlyCreatorAds: false,
    councilSoftVote: false,
    ambassadorEligible: false,
  },
  silver: {
    support: "standard_plus",
    salon: false,
    boostPerDay: 3,
    boostActiveMax: 1,
    academySoft: false,
    betaSug: false,
    privateEvents: false,
    earlyCreatorAds: false,
    councilSoftVote: false,
    ambassadorEligible: false,
  },
  gold: {
    support: "priority",
    salon: true,
    boostPerDay: 5,
    boostActiveMax: 2,
    academySoft: true,
    betaSug: false,
    privateEvents: false,
    earlyCreatorAds: false,
    councilSoftVote: false,
    ambassadorEligible: true,
  },
  diamond: {
    support: "priority",
    salon: true,
    boostPerDay: 6,
    boostActiveMax: 2,
    academySoft: true,
    betaSug: true,
    privateEvents: true,
    earlyCreatorAds: false,
    councilSoftVote: false,
    ambassadorEligible: true,
  },
  platinum: {
    support: "concierge",
    salon: true,
    boostPerDay: 8,
    boostActiveMax: 3,
    academySoft: true,
    betaSug: true,
    privateEvents: true,
    earlyCreatorAds: true,
    councilSoftVote: true,
    ambassadorEligible: true,
  },
};

/** Apply relative discount then clamp to absolute floor. */
export function draftFeeRateAfterBuildersDiscount(
  baselineRate: number,
  relativeDiscount: number,
  floorRate: number,
): number {
  const cut = baselineRate * (1 - relativeDiscount);
  return Math.max(floorRate, cut);
}
