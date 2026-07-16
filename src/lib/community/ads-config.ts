/** Horizon B ads helpers — spend paths stay gated until BSC launch. */

export const ADS_SPLIT = {
  creatorFundPct: 50,
  burnPct: 25,
  opsPct: 25,
} as const;

export const ADS_PRODUCT_CODES = [
  "ad_boost_mcb",
  "ad_feed_brand",
  "ad_live_sponsor",
  "ad_job_local",
] as const;

export type AdsProductCode = (typeof ADS_PRODUCT_CODES)[number];

export function splitAdsSpendMcb(amount: number): {
  creatorFund: number;
  burn: number;
  ops: number;
} {
  const n = Math.max(0, amount);
  const creatorFund = Math.floor((n * ADS_SPLIT.creatorFundPct) / 100);
  const burn = Math.floor((n * ADS_SPLIT.burnPct) / 100);
  const ops = n - creatorFund - burn;
  return { creatorFund, burn, ops };
}
