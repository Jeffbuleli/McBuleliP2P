/**
 * P2P marketplace configuration — aligned with common OTC/P2P marketplace patterns:
 * fixed-price ads, escrowed crypto on-platform, fiat settled off-platform with maker instructions.
 */

export type P2pCryptoAsset = "USDT" | "PI";
export type P2pSide = "sell" | "buy";
export type P2pAdStatus = "active" | "paused" | "closed";
export type P2pOrderStatus =
  | "awaiting_payment"
  | "paid"
  | "disputed"
  | "released"
  | "cancelled"
  | "expired"
  | "refunded";

/** Fiat codes commonly used across Central & West Africa + global rails (expand over time). */
export const P2P_FIAT_CURRENCIES = [
  "CDF",
  "USD",
  "EUR",
  "XAF",
  "XOF",
  "NGN",
  "KES",
  "UGX",
  "TZS",
  "BIF",
  "ZAR",
  "GHS",
  "RWF",
] as const;
export type P2pFiatCurrency = (typeof P2P_FIAT_CURRENCIES)[number];

export function isP2pFiat(s: string): s is P2pFiatCurrency {
  return (P2P_FIAT_CURRENCIES as readonly string[]).includes(s);
}

/** ISO 3166-1 alpha-2 — primary corridors McBuleli serves first. */
export const P2P_COUNTRY_CODES = [
  "CD",
  "CG",
  "RW",
  "BI",
  "UG",
  "TZ",
  "SN",
  "CI",
  "CM",
  "NG",
  "KE",
  "GH",
  "ZA",
  "FR",
  "BE",
  "US",
  "OTHER",
] as const;
export type P2pCountryCode = (typeof P2P_COUNTRY_CODES)[number];

export function paymentWindowMinutes(): number {
  const n = Number(process.env.P2P_PAYMENT_WINDOW_MINUTES ?? "45");
  return Number.isFinite(n) && n >= 10 && n <= 240 ? n : 45;
}

/** Basis points (100 = 1%). Capped at 500 (5%) for safety. */
export function p2pFeeBpsConfigured(): number {
  const n = Number(process.env.P2P_FEE_BPS ?? "0");
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(500, Math.floor(n));
}

export function minCryptoForAsset(asset: P2pCryptoAsset): number {
  const raw =
    asset === "USDT"
      ? Number(process.env.P2P_MIN_CRYPTO_USDT ?? "5")
      : Number(process.env.P2P_MIN_CRYPTO_PI ?? "50");
  return Number.isFinite(raw) && raw > 0 ? raw : asset === "USDT" ? 5 : 50;
}
