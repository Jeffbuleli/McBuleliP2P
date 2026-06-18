export function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET must be set (min 16 chars)");
  }
  return s;
}

export function getMinDeposit(asset: string): number {
  if (asset === "USDT") {
    /** Default when no user context; TXID confirm uses `getEffectiveMinDepositUsdt`. */
    const v = Number(process.env.MIN_DEPOSIT_USDT ?? "0.1");
    return Number.isFinite(v) ? v : 0.1;
  }
  if (asset === "PI") {
    const v = Number(process.env.MIN_DEPOSIT_PI ?? "1");
    return Number.isFinite(v) ? v : 1;
  }
  return 1;
}

/** Relative tolerance for floating compare (e.g. 1e-8) */
export function getAmountTolerance(): number {
  const v = Number(process.env.AMOUNT_TOLERANCE ?? "0.00000001");
  return Number.isFinite(v) ? v : 1e-8;
}

/** USDT deposit/withdraw rails — only BINANCE_WALLET_* (not BINANCE_API_*). */
export function hasBinanceWalletKeys(): boolean {
  const key = process.env.BINANCE_WALLET_API_KEY?.trim();
  const secret = process.env.BINANCE_WALLET_API_SECRET?.trim();
  return Boolean(key && secret);
}

export function getBinanceWalletCredentials(): { key: string; secret: string } {
  const key = process.env.BINANCE_WALLET_API_KEY?.trim() ?? "";
  const secret = process.env.BINANCE_WALLET_API_SECRET?.trim() ?? "";
  if (!key || !secret) {
    throw new Error(
      "BINANCE_WALLET_API_KEY and BINANCE_WALLET_API_SECRET must be set in server .env",
    );
  }
  return { key, secret };
}

/** @deprecated Use hasBinanceWalletKeys — wallet no longer reads BINANCE_API_*. */
export function hasBinanceKeys(): boolean {
  return hasBinanceWalletKeys();
}

export function hasOkxKeys(): boolean {
  return Boolean(
    process.env.OKX_API_KEY?.trim() &&
      process.env.OKX_API_SECRET?.trim() &&
      process.env.OKX_API_PASSPHRASE?.trim(),
  );
}

// ── FreshPay / MOKO — two independent rails (do not mix credentials) ───────────
//
// 1) Mobile money (Airtel, Orange, M-Pesa…) — PayDRC gateway JSON API
//    merchant_id + merchant_secrete in body; callbacks = AES + HMAC on encrypted `data`
//
// 2) Card (Cybersource hosted checkout) — NOT wired in McBuleli yet
//    X-API-Key + HMAC headers; callbacks = plain JSON + Callback Secret

/** Mobile money pay-in / pay-out / verify (gateway JSON). */
export function hasFreshpayMobileMoneyKeys(): boolean {
  return Boolean(
    process.env.FRESHPAY_MERCHANT_ID?.trim() &&
      process.env.FRESHPAY_SECRET?.trim(),
  );
}

/** Mobile money webhook decryption (separate from card Callback Secret). */
export function hasFreshpayMobileMoneyCallbackKeys(): boolean {
  return Boolean(
    process.env.FRESHPAY_AES_KEY?.trim() &&
      process.env.FRESHPAY_HMAC_KEY?.trim(),
  );
}

/** @deprecated Alias — mobile money gateway only (not card). */
export function hasFreshpayKeys(): boolean {
  return hasFreshpayMobileMoneyKeys();
}

/** @deprecated Use hasFreshpayMobileMoneyKeys */
export function hasPawapayKeys(): boolean {
  return hasFreshpayMobileMoneyKeys();
}

/** Card rail (Cybersource hosted checkout) — future use. */
export function hasFreshpayCardKeys(): boolean {
  return Boolean(
    process.env.FRESHPAY_CARD_API_KEY?.trim() &&
      process.env.FRESHPAY_CARD_API_SECRET?.trim() &&
      process.env.FRESHPAY_CARD_CALLBACK_SECRET?.trim(),
  );
}

export function getFreshpayMerchantId(): string {
  const id = process.env.FRESHPAY_MERCHANT_ID?.trim();
  if (!id) throw new Error("FRESHPAY_MERCHANT_ID must be set");
  return id;
}

export function getFreshpayMerchantSecret(): string {
  const s = process.env.FRESHPAY_SECRET?.trim();
  if (!s) throw new Error("FRESHPAY_SECRET must be set");
  return s;
}

export function getFreshpayAesKey(): string {
  const k = process.env.FRESHPAY_AES_KEY?.trim();
  if (!k) throw new Error("FRESHPAY_AES_KEY must be set (mobile money callbacks)");
  return k;
}

export function getFreshpayHmacKey(): string {
  const k = process.env.FRESHPAY_HMAC_KEY?.trim();
  if (!k) throw new Error("FRESHPAY_HMAC_KEY must be set (mobile money callbacks)");
  return k;
}

export function getFreshpayGatewayUrl(): string {
  const override = process.env.FRESHPAY_API_BASE_URL?.trim();
  if (override) return override.replace(/\/+$/, "");
  const env = (process.env.FRESHPAY_ENV ?? "sandbox").trim().toLowerCase();
  return env === "prod" || env === "production"
    ? "https://paydrc.gofreshbakery.net/api/v5/"
    : "https://api.gofreshpay.com/api/v1/gateway";
}

export function getFreshpayCardApiBaseUrl(): string {
  const override = process.env.FRESHPAY_CARD_API_BASE_URL?.trim();
  if (override) return override.replace(/\/+$/, "");
  const env = (process.env.FRESHPAY_ENV ?? "sandbox").trim().toLowerCase();
  return env === "prod" || env === "production"
    ? "https://card.gofreshpay.com"
    : "https://test.card.gofreshpay.com";
}

export function getFreshpayCardApiKey(): string {
  const k = process.env.FRESHPAY_CARD_API_KEY?.trim();
  if (!k) throw new Error("FRESHPAY_CARD_API_KEY must be set");
  return k;
}

export function getFreshpayCardApiSecret(): string {
  const s = process.env.FRESHPAY_CARD_API_SECRET?.trim();
  if (!s) throw new Error("FRESHPAY_CARD_API_SECRET must be set");
  return s;
}

export function getFreshpayCardCallbackSecret(): string {
  const s = process.env.FRESHPAY_CARD_CALLBACK_SECRET?.trim();
  if (!s) throw new Error("FRESHPAY_CARD_CALLBACK_SECRET must be set");
  return s;
}

/** Optional comma-separated callback source IPs (mobile money). */
export function getFreshpayCallbackIps(): string[] {
  const raw = process.env.FRESHPAY_CALLBACK_IPS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
