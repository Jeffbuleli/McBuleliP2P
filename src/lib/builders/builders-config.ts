import { getMcbDexUrl, getMcbTokenContract } from "@/lib/mcb-token-config";
import {
  BUILDERS_FEE_PERKS_MIN_MCB_USD,
  BUILDERS_TIER_PRICE_MCB_LEGACY,
  BUILDERS_TIER_PRICE_USD,
  quoteAllBuildersTiers,
  quoteBuildersTier,
} from "@/lib/builders/builders-pricing";

export const BUILDERS_TIERS = [
  "bronze",
  "silver",
  "gold",
  "diamond",
  "platinum",
] as const;

export type BuildersTier = (typeof BUILDERS_TIERS)[number];

export const BUILDERS_MEMBERSHIP_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  EXPIRED: "expired",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export type BuildersMembershipStatus =
  (typeof BUILDERS_MEMBERSHIP_STATUS)[keyof typeof BUILDERS_MEMBERSHIP_STATUS];

/** Validity of a confirmed badge (months). */
export const BUILDERS_BADGE_MONTHS = 24;

/**
 * @deprecated Fixed McB stickers — unsafe as economic price when McB is cheap.
 * Use BUILDERS_TIER_PRICE_USD + quoteBuildersTier(). Kept for tests / legacy UI.
 */
export const BUILDERS_TIER_PRICE_MCB = BUILDERS_TIER_PRICE_MCB_LEGACY;

export { BUILDERS_TIER_PRICE_USD };

export const BUILDERS_TIER_RANK: Record<BuildersTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  diamond: 4,
  platinum: 5,
};

function envTruthy(v: string | undefined): boolean {
  return v === "true" || v === "1";
}

/** Accept new purchase requests (admin still confirms tx). */
export function isBuildersProgramEnabled(): boolean {
  return envTruthy(process.env.BUILDERS_PROGRAM_ENABLED);
}

/** Show Builders page even before purchases open. */
export function isBuildersProgramVisible(): boolean {
  if (process.env.NEXT_PUBLIC_BUILDERS_PREVIEW === "false") {
    return isBuildersProgramEnabled();
  }
  return true;
}

export function getBuildersTreasuryAddress(): string | null {
  const v =
    process.env.MCB_BUILDERS_TREASURY?.trim() ||
    process.env.MCB_TREASURY_ADDRESS?.trim();
  if (!v || !/^0x[a-fA-F0-9]{40}$/.test(v)) return null;
  return v;
}

export function isBuildersTier(v: string): v is BuildersTier {
  return (BUILDERS_TIERS as readonly string[]).includes(v);
}

/** @deprecated Prefer quoteBuildersTier(tier).priceMcb */
export function buildersTierPriceMcb(tier: BuildersTier): number {
  const q = quoteBuildersTier(tier);
  return q.priceMcb ?? BUILDERS_TIER_PRICE_MCB_LEGACY[tier];
}

export function buildersTierPriceUsd(tier: BuildersTier): number {
  return BUILDERS_TIER_PRICE_USD[tier];
}

export function getBuildersPublicCatalog() {
  const quotes = quoteAllBuildersTiers();
  return {
    preview: isBuildersProgramVisible(),
    enabled: isBuildersProgramEnabled(),
    badgeMonths: BUILDERS_BADGE_MONTHS,
    treasuryAddress: getBuildersTreasuryAddress(),
    dexUrl: getMcbDexUrl(),
    contractAddress: getMcbTokenContract(),
    quoteMode: "usd_anchor" as const,
    mcbUsdRate: quotes[0]?.mcbUsdRate ?? null,
    rateSource: quotes[0]?.rateSource ?? "unavailable",
    feePerksMinMcbUsd: BUILDERS_FEE_PERKS_MIN_MCB_USD,
    tiers: quotes.map((q) => ({
      tier: q.tier,
      priceUsd: q.priceUsd,
      priceMcb: q.priceMcb,
      /** Legacy sticker — not the economic price. */
      priceMcbLegacy: BUILDERS_TIER_PRICE_MCB_LEGACY[q.tier],
      rank: BUILDERS_TIER_RANK[q.tier],
      feePerksUnlocked: q.feePerksUnlocked,
    })),
  };
}
