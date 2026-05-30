/** Fixed platform fee (USDT) on external withdrawals — added on top of net amount. */
export const EXTERNAL_WITHDRAW_FEE_USDT = 2;

/** Binance catalogue default when API unavailable ([cryptoFee](https://www.binance.com/en/fee/cryptoFee)). */
export const DEFAULT_BINANCE_WITHDRAW_MIN_USDT = 5;

export const DEFAULT_BINANCE_WITHDRAW_INTERNAL_MIN_USDT = 0.000001;

/** Minimum net shown to McBuleli users (external on-chain destination). */
export const MCBULELI_MIN_WITHDRAW_NET_EXTERNAL_USDT = 5;

/** Minimum net shown to McBuleli users (internal McBuleli / partner wallet). */
export const MCBULELI_MIN_WITHDRAW_NET_INTERNAL_USDT = 1;

/** @deprecated Use live quote from `resolveUsdtWithdrawQuote`. */
export const MIN_WITHDRAW_NET_USDT = MCBULELI_MIN_WITHDRAW_NET_EXTERNAL_USDT;

/** @deprecated alias */
export const MIN_WITHDRAW_NET_USDT_EXCLUSIVE_FLOOR = MCBULELI_MIN_WITHDRAW_NET_EXTERNAL_USDT;

export const EXTERNAL_WITHDRAW_FEE_PI = 2;
export const MIN_WITHDRAW_NET_PI = 10;

export function feeToNumericString(fee: number): string {
  return fee.toFixed(8);
}

export type ParsedWithdrawAmount =
  | { ok: true; net: string; fee: string; totalDebit: string }
  | { ok: false; message: string };

export function parseNetWithdrawal(args: {
  netAmountStr: string;
  userFeeUsdt?: number;
  minNetUsdt?: number;
}): ParsedWithdrawAmount {
  const net = Number(args.netAmountStr);
  const minNet = args.minNetUsdt ?? MCBULELI_MIN_WITHDRAW_NET_EXTERNAL_USDT;
  const feeN = args.userFeeUsdt ?? EXTERNAL_WITHDRAW_FEE_USDT;
  if (!Number.isFinite(net) || net <= 0) {
    return { ok: false, message: "Invalid amount." };
  }
  if (net + 1e-12 < minNet) {
    return {
      ok: false,
      message: `Net amount must be at least ${minNet} USDT.`,
    };
  }
  const total = net + feeN;
  return {
    ok: true,
    net: args.netAmountStr,
    fee: feeToNumericString(feeN),
    totalDebit: total.toFixed(18),
  };
}

export function parseNetWithdrawalPi(args: {
  netAmountStr: string;
}): ParsedWithdrawAmount {
  const net = Number(args.netAmountStr);
  if (!Number.isFinite(net) || net <= 0) {
    return { ok: false, message: "Invalid amount." };
  }
  if (net + 1e-12 < MIN_WITHDRAW_NET_PI) {
    return {
      ok: false,
      message: `Minimum withdrawal is ${MIN_WITHDRAW_NET_PI} PI (net).`,
    };
  }
  const feeN = EXTERNAL_WITHDRAW_FEE_PI;
  const total = net + feeN;
  return {
    ok: true,
    net: args.netAmountStr,
    fee: feeToNumericString(feeN),
    totalDebit: total.toFixed(18),
  };
}

export function totalDebitedFromRow(row: {
  amount: string;
  fee: string | null;
}): string {
  const a = Number(row.amount);
  const f = Number(row.fee ?? 0);
  if (!Number.isFinite(a) || !Number.isFinite(f)) return row.amount;
  return (a + f).toFixed(18);
}
