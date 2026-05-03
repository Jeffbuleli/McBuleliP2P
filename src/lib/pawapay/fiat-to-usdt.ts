/**
 * Convert collected fiat (CDF / USD) to USDT for crediting when initiating
 * deposit without explicit `metadata.usdtAmount`.
 *
 * Env:
 * - PAWAPAY_CDF_PER_USDT — how many CDF for 1 USDT (e.g. 2800)
 * - PAWAPAY_USD_PER_USDT — usually ~1 (USD fiat per 1 USDT)
 */

const DEFAULT_CDF_PER_USDT = "2800";
const DEFAULT_USD_PER_USDT = "1";

export function fiatAmountToUsdt(args: {
  amountStr: string;
  currency: string;
}): number | null {
  const amt = Number(args.amountStr);
  if (!Number.isFinite(amt) || amt <= 0) return null;
  const c = args.currency.toUpperCase();
  if (c === "CDF") {
    const rate = Number(process.env.PAWAPAY_CDF_PER_USDT ?? DEFAULT_CDF_PER_USDT);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return amt / rate;
  }
  if (c === "USD") {
    const rate = Number(process.env.PAWAPAY_USD_PER_USDT ?? DEFAULT_USD_PER_USDT);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return amt / rate;
  }
  return null;
}
