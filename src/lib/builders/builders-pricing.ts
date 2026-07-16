/**
 * Builders pricing — USD notional anchor, settled in McB at a rate.
 *
 * Fixed McB sticker prices are unsafe at launch: if 1 USD buys many McB,
 * a cheap badge would unlock fee discounts while McBuleli still pays MM
 * aggregators and on-chain withdraw costs.
 *
 * Rule: tier price = USD for 24 months; McB amount = f(spot/TWAP).
 */

export const BUILDERS_PRICING_TIERS = [
  "bronze",
  "silver",
  "gold",
  "diamond",
  "platinum",
] as const;

export type BuildersPricingTier = (typeof BUILDERS_PRICING_TIERS)[number];

/**
 * Economic price of each badge (24 months) in USD notional.
 * Sized so max fee CAP + soft OPEX over the period stay below this revenue.
 * Adjust only with finance sign-off.
 */
export const BUILDERS_TIER_PRICE_USD: Record<BuildersPricingTier, number> = {
  bronze: 25,
  silver: 75,
  gold: 200,
  diamond: 500,
  platinum: 1_250,
};

/**
 * Legacy fixed McB stickers (deprecated as economic price).
 * Kept for UI fallback / migration notes only — do not use for fee-discount eligibility.
 * Historically ≈ USD price at an assumed ~$0.25 / McB.
 */
export const BUILDERS_TIER_PRICE_MCB_LEGACY: Record<
  BuildersPricingTier,
  number
> = {
  bronze: 100,
  silver: 300,
  gold: 800,
  diamond: 2_000,
  platinum: 5_000,
};

/** Never treat McB as cheaper than this USD for quoting (anti-dump / illiquid launch). */
export const BUILDERS_MCB_USD_FLOOR = 0.000_05;

/**
 * Below this TWAP (USD/McB), fee-discount perks stay OFF (soft badge only).
 * Forces meaningful buy pressure before treasury risk opens.
 */
export const BUILDERS_FEE_PERKS_MIN_MCB_USD = 0.01;

/** TWAP window label for ops (implementation may use Pancake subgraph / admin rate). */
export const BUILDERS_MCB_TWAP_LABEL = "1h TWAP or admin MCB_USD_RATE";

export type BuildersMcbUsdSource =
  | "env_rate"
  | "floor"
  | "unavailable";

export type BuildersTierQuote = {
  tier: BuildersPricingTier;
  priceUsd: number;
  /** McB to transfer at quote time (ceil). Null if no usable rate. */
  priceMcb: number | null;
  mcbUsdRate: number | null;
  rateSource: BuildersMcbUsdSource;
  /** Fee discounts may apply only if true at purchase + while membership active. */
  feePerksUnlocked: boolean;
  quoteMode: "usd_anchor";
};

function envMcbUsdRate(): number | null {
  const raw =
    process.env.MCB_USD_RATE?.trim() ||
    process.env.MCB_USD_TWAP?.trim() ||
    process.env.BUILDERS_MCB_USD_RATE?.trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Effective USD per McB used for quotes (spot/TWAP clamped to floor). */
export function resolveBuildersMcbUsdRate(): {
  rate: number | null;
  source: BuildersMcbUsdSource;
} {
  const env = envMcbUsdRate();
  if (env == null) {
    return { rate: null, source: "unavailable" };
  }
  if (env < BUILDERS_MCB_USD_FLOOR) {
    return { rate: BUILDERS_MCB_USD_FLOOR, source: "floor" };
  }
  return { rate: env, source: "env_rate" };
}

export function buildersTierPriceUsd(tier: BuildersPricingTier): number {
  return BUILDERS_TIER_PRICE_USD[tier];
}

/** McB amount required for a USD notional at a given USD/McB rate. */
export function mcbAmountForUsdNotional(
  priceUsd: number,
  mcbUsdRate: number,
): number {
  if (!(priceUsd > 0) || !(mcbUsdRate > 0)) return 0;
  return Math.ceil(priceUsd / mcbUsdRate);
}

export function quoteBuildersTier(
  tier: BuildersPricingTier,
): BuildersTierQuote {
  const priceUsd = BUILDERS_TIER_PRICE_USD[tier];
  const { rate, source } = resolveBuildersMcbUsdRate();
  if (rate == null) {
    return {
      tier,
      priceUsd,
      priceMcb: null,
      mcbUsdRate: null,
      rateSource: source,
      feePerksUnlocked: false,
      quoteMode: "usd_anchor",
    };
  }
  const priceMcb = mcbAmountForUsdNotional(priceUsd, rate);
  const feePerksUnlocked = rate >= BUILDERS_FEE_PERKS_MIN_MCB_USD;
  return {
    tier,
    priceUsd,
    priceMcb,
    mcbUsdRate: rate,
    rateSource: source,
    feePerksUnlocked,
    quoteMode: "usd_anchor",
  };
}

export function quoteAllBuildersTiers(): BuildersTierQuote[] {
  return BUILDERS_PRICING_TIERS.map((t) => quoteBuildersTier(t));
}

/**
 * Eligibility for fee discounts on an active membership.
 * Requires recorded USD notional ≥ 95% of catalog USD (anti underpay).
 */
export function membershipFeePerksEligible(args: {
  tier: BuildersPricingTier;
  paidUsdNotional: number | null | undefined;
  mcbUsdRateAtPurchase: number | null | undefined;
}): boolean {
  const need = BUILDERS_TIER_PRICE_USD[args.tier] * 0.95;
  const paid = args.paidUsdNotional;
  if (paid == null || !(paid >= need)) return false;
  const rate = args.mcbUsdRateAtPurchase;
  if (rate == null || rate < BUILDERS_FEE_PERKS_MIN_MCB_USD) return false;
  return true;
}
