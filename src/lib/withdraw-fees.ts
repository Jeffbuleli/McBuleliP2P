/** Fixed platform fee (USDT) on every external withdrawal — added on top of net amount. */
export const EXTERNAL_WITHDRAW_FEE_USDT = 2;

/**
 * Minimum **net** USDT that must arrive at the destination address.
 */
export const MIN_WITHDRAW_NET_USDT = 10;

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
  if (net + 1e-12 < MIN_WITHDRAW_NET_USDT) {
    return {
      ok: false,
      message: `Minimum withdrawal is ${MIN_WITHDRAW_NET_USDT} USDT (net).`,
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
