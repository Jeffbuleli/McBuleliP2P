import { getMcbDexUrl, getMcbTokenContract } from "@/lib/mcb-token-config";

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
 * Draft McB prices — utility / status only, not investment advice.
 * Override later via env if needed; keep in sync with builders-program-spec.
 */
export const BUILDERS_TIER_PRICE_MCB: Record<BuildersTier, number> = {
  bronze: 100,
  silver: 300,
  gold: 800,
  diamond: 2000,
  platinum: 5000,
};

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

export function buildersTierPriceMcb(tier: BuildersTier): number {
  return BUILDERS_TIER_PRICE_MCB[tier];
}

export function getBuildersPublicCatalog() {
  return {
    preview: isBuildersProgramVisible(),
    enabled: isBuildersProgramEnabled(),
    badgeMonths: BUILDERS_BADGE_MONTHS,
    treasuryAddress: getBuildersTreasuryAddress(),
    dexUrl: getMcbDexUrl(),
    contractAddress: getMcbTokenContract(),
    tiers: BUILDERS_TIERS.map((tier) => ({
      tier,
      priceMcb: BUILDERS_TIER_PRICE_MCB[tier],
      rank: BUILDERS_TIER_RANK[tier],
    })),
  };
}
