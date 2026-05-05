/** Fixed platform fee (USDT) on every external withdrawal — added on top of net amount. */
export const EXTERNAL_WITHDRAW_FEE_USDT = 2;

/**
 * Net USDT sent on-chain must be **strictly greater than** this value (Binance minimum withdrawal is 10 USDT;
 * we align so payouts remain executable). Wallet debit = net + {@link EXTERNAL_WITHDRAW_FEE_USDT}.
 */
export const MIN_WITHDRAW_NET_USDT_EXCLUSIVE_FLOOR = 10;

/** @deprecated alias — use `MIN_WITHDRAW_NET_USDT_EXCLUSIVE_FLOOR`; validation is `net > floor`. */
export const MIN_WITHDRAW_NET_USDT = MIN_WITHDRAW_NET_USDT_EXCLUSIVE_FLOOR;

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
}): ParsedWithdrawAmount {
  const net = Number(args.netAmountStr);
  if (!Number.isFinite(net) || net <= 0) {
    return { ok: false, message: "Invalid amount." };
  }
  if (!(net > MIN_WITHDRAW_NET_USDT_EXCLUSIVE_FLOOR + 1e-12)) {
    return {
      ok: false,
      message: `Net amount must be strictly greater than ${MIN_WITHDRAW_NET_USDT_EXCLUSIVE_FLOOR} USDT.`,
    };
  }
  const feeN = EXTERNAL_WITHDRAW_FEE_USDT;
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
