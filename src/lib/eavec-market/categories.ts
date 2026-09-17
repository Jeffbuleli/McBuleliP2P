/** e-AVEC Marché categories — visual, short labels (i18n keys elsewhere). */

export const EAVEC_MARKET_CATEGORIES = [
  "agriculture",
  "food",
  "fashion",
  "services",
  "home",
  "tech",
  "other",
] as const;

export type EavecMarketCategory = (typeof EAVEC_MARKET_CATEGORIES)[number];

export const EAVEC_MARKET_CATEGORY_EMOJI: Record<EavecMarketCategory, string> = {
  agriculture: "🌾",
  food: "🍎",
  fashion: "👕",
  services: "🔧",
  home: "🏠",
  tech: "📱",
  other: "🧰",
};

export function isEavecMarketCategory(v: string): v is EavecMarketCategory {
  return (EAVEC_MARKET_CATEGORIES as readonly string[]).includes(v);
}

export const EAVEC_MARKET_STATUSES = [
  "pending_review",
  "available",
  "reserved",
  "sold",
  "paused",
  "closed",
  "rejected",
] as const;

export type EavecMarketListingStatus = (typeof EAVEC_MARKET_STATUSES)[number];

/** Marché e-AVEC is CDF / Fc only (DRC public). */
export const EAVEC_MARKET_CURRENCIES = ["CDF"] as const;
export type EavecMarketCurrency = (typeof EAVEC_MARKET_CURRENCIES)[number];

export const EAVEC_MARKET_KINDS = ["product", "service"] as const;
export type EavecMarketKind = (typeof EAVEC_MARKET_KINDS)[number];

/** Max data-URL image length (~400KB base64). */
export const EAVEC_MARKET_IMAGE_MAX_CHARS = 550_000;
