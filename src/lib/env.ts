export function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET must be set (min 16 chars)");
  }
  return s;
}

export function getMinDeposit(asset: string): number {
  if (asset === "USDT") {
    const v = Number(process.env.MIN_DEPOSIT_USDT ?? "1");
    return Number.isFinite(v) ? v : 1;
  }
  return 1;
}

export function getMinWithdraw(asset: string): number {
  if (asset === "USDT") {
    const v = Number(process.env.MIN_WITHDRAW_USDT ?? "5");
    return Number.isFinite(v) ? v : 5;
  }
  return 5;
}

/** Relative tolerance for floating compare (e.g. 1e-8) */
export function getAmountTolerance(): number {
  const v = Number(process.env.AMOUNT_TOLERANCE ?? "0.00000001");
  return Number.isFinite(v) ? v : 1e-8;
}

export function hasBinanceKeys(): boolean {
  return Boolean(process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET);
}

export function hasOkxKeys(): boolean {
  return Boolean(
    process.env.OKX_API_KEY &&
      process.env.OKX_API_SECRET &&
      process.env.OKX_PASSPHRASE,
  );
}
