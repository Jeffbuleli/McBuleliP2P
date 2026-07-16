/**
 * Live soft perks for active Builders badges (no fee discounts).
 * Fee % stay in builders-perks-draft.ts until finance signs.
 */
import type { BuildersTier } from "@/lib/builders/builders-config";
import { isBuildersTier } from "@/lib/builders/builders-config";
import { COMMUNITY_POST_BOOST } from "@/lib/reward-points-config";

export type BuildersSoftPerks = {
  support: "standard_plus" | "priority" | "concierge";
  salon: boolean;
  boostPerDay: number;
  boostActiveMax: number;
  academySoft: boolean;
  betaSug: boolean;
  privateEvents: boolean;
  earlyCreatorAds: boolean;
  councilSoftVote: boolean;
  /** Soft gate for Ambassadeur charter application — not a mandate. */
  ambassadorEligible: boolean;
};

export const BUILDERS_SOFT_PERKS: Record<BuildersTier, BuildersSoftPerks> = {
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

export function softPerksForTier(tier: BuildersTier): BuildersSoftPerks {
  return BUILDERS_SOFT_PERKS[tier];
}

export function softPerksForTierOrNull(
  tier: string | null | undefined,
): BuildersSoftPerks | null {
  if (!tier || !isBuildersTier(tier)) return null;
  return BUILDERS_SOFT_PERKS[tier];
}

/** Community boost limits: baseline, raised by active Builder tier. */
export function buildersBoostLimits(tier: string | null | undefined): {
  maxPerDay: number;
  maxActivePerUser: number;
} {
  const perks = softPerksForTierOrNull(tier);
  if (!perks) {
    return {
      maxPerDay: COMMUNITY_POST_BOOST.maxPerDay,
      maxActivePerUser: COMMUNITY_POST_BOOST.maxActivePerUser,
    };
  }
  return {
    maxPerDay: Math.max(COMMUNITY_POST_BOOST.maxPerDay, perks.boostPerDay),
    maxActivePerUser: Math.max(
      COMMUNITY_POST_BOOST.maxActivePerUser,
      perks.boostActiveMax,
    ),
  };
}

export function isAmbassadorCharterEligible(
  tier: string | null | undefined,
): boolean {
  return softPerksForTierOrNull(tier)?.ambassadorEligible === true;
}
