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

export function hasBinanceKeys(): boolean {
  return Boolean(
    process.env.BINANCE_API_KEY?.trim() &&
      process.env.BINANCE_API_SECRET?.trim(),
  );
}

export function hasOkxKeys(): boolean {
  return Boolean(
    process.env.OKX_API_KEY?.trim() &&
      process.env.OKX_API_SECRET?.trim() &&
      process.env.OKX_API_PASSPHRASE?.trim(),
  );
}

export function hasPawapayKeys(): boolean {
  return Boolean(process.env.PAWAPAY_API_TOKEN?.trim());
}

export function getPawapayApiToken(): string {
  const t = process.env.PAWAPAY_API_TOKEN?.trim();
  if (!t) {
    throw new Error("PAWAPAY_API_TOKEN must be set");
  }
  return t;
}

export function getPawapayBaseUrl(): string {
  const override = process.env.PAWAPAY_API_BASE_URL?.trim();
  if (override) {
    return override.replace(/\/+$/, "");
  }
  const env = (process.env.PAWAPAY_ENV ?? "sandbox").trim().toLowerCase();
  return env === "prod" || env === "production"
    ? "https://api.pawapay.io"
    : "https://api.sandbox.pawapay.io";
}

/**
 * Optional: some teams store a shared secret for callbacks.
 *
 * Note: PawaPay v2 signed callbacks are verified using pawaPay public keys (RFC-9421),
 * not a shared secret. This value is currently not used unless you build custom validation.
 */
export function getPawapayCallbackSecret(): string | null {
  const s = process.env.PAWAPAY_CALLBACK_SECRET?.trim();
  return s ? s : null;
}
