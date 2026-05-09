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

/** Quote currencies used for P2P pricing (off-platform by default). */
export const P2P_FIAT_CURRENCIES = [
  "CDF",
  "USD",
  // Crypto quotes (P2P atomic swap): USDT ⇄ PI
  "USDT",
  "PI",
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

/**
 * McBuleli default: only CDF & USD as **quote** currencies (MoMo / cash off-platform).
 * Escrow stays USDT/PI only — custodial USD/CDF wallet balances are never used for P2P settlement.
 *
 * Override with `NEXT_PUBLIC_P2P_QUOTE_FIATS` (comma-separated ISO codes).
 * Set to `ALL`, `FULL`, or `*` to allow every {@link P2P_FIAT_CURRENCIES} code again.
 */
const P2P_QUOTE_FIAT_DEFAULT: P2pFiatCurrency[] = ["CDF", "USD", "USDT", "PI"];

export function p2pQuoteFiatRestrictionEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_P2P_QUOTE_FIATS?.trim();
  if (raw === "*" || raw === "ALL" || raw === "FULL") return false;
  return true;
}

/** Fiat codes allowed for new P2P ads and market listing (quote / off-platform leg). */
export function p2pAllowedQuoteFiats(): P2pFiatCurrency[] {
  const raw = process.env.NEXT_PUBLIC_P2P_QUOTE_FIATS?.trim();
  if (raw === "*" || raw === "ALL" || raw === "FULL") {
    return [...P2P_FIAT_CURRENCIES];
  }
  if (!raw) {
    return [...P2P_QUOTE_FIAT_DEFAULT];
  }
  const out: P2pFiatCurrency[] = [];
  for (const p of raw.split(",")) {
    const c = p.trim().toUpperCase();
    if (isP2pFiat(c)) out.push(c);
  }
  return out.length > 0 ? out : [...P2P_QUOTE_FIAT_DEFAULT];
}

export function isAllowedP2pQuoteFiat(code: string): boolean {
  const c = code.trim().toUpperCase();
  if (!isP2pFiat(c)) return false;
  if (!p2pQuoteFiatRestrictionEnabled()) return true;
  return p2pAllowedQuoteFiats().includes(c as P2pFiatCurrency);
}

export function isP2pCryptoQuoteCurrency(code: string): boolean {
  const c = code.trim().toUpperCase();
  return c === "USDT" || c === "PI";
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
