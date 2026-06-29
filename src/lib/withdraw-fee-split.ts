import type { NetworkId } from "@/lib/networks";
import {
  EXTERNAL_WITHDRAW_FEE_USDT,
  feeToNumericString,
} from "@/lib/withdraw-fees";

export type WithdrawFeeSplit = {
  providerFee: string;
  platformFee: string;
};

/**
 * Split McBuleli user fee (always 2 USDT): Binance network cost first, remainder to McBuleli.
 * Internal Binance transfer → binanceFeeUsdt = 0 → full user fee stays with McBuleli.
 */
export function computeWithdrawFeeSplit(args: {
  userFeeUsdt: number;
  binanceFeeUsdt: number;
}): WithdrawFeeSplit {
  const userFee = Math.max(0, args.userFeeUsdt);
  const provider = Math.min(Math.max(0, args.binanceFeeUsdt), userFee);
  const platform = userFee - provider;
  return {
    providerFee: feeToNumericString(provider),
    platformFee: feeToNumericString(platform),
  };
}

export async function resolveBinanceUsdtWithdrawFee(
  network: NetworkId,
): Promise<number | null> {
  try {
    const { binanceUsdtWithdrawFee } = await import("@/lib/binance");
    return await binanceUsdtWithdrawFee(network);
  } catch {
    return null;
  }
}

export async function resolveUsdtFeeSplitForNetwork(
  network: NetworkId,
  userFeeUsdt = EXTERNAL_WITHDRAW_FEE_USDT,
): Promise<WithdrawFeeSplit> {
  const binanceFee = (await resolveBinanceUsdtWithdrawFee(network)) ?? 0;
  return computeWithdrawFeeSplit({
    userFeeUsdt,
    binanceFeeUsdt: binanceFee,
  });
}

export async function resolveUsdtFeeSplitForQuote(args: {
  isInternal: boolean;
  userFeeUsdt: number;
  binanceListFeeUsdt: number;
}): Promise<WithdrawFeeSplit> {
  return computeWithdrawFeeSplit({
    userFeeUsdt: args.userFeeUsdt,
    binanceFeeUsdt: args.isInternal ? 0 : args.binanceListFeeUsdt,
  });
}

/** PI / manual rails - full user fee stays with McBuleli. */
export function piWithdrawFeeSplit(userFee: string): WithdrawFeeSplit {
  return {
    providerFee: feeToNumericString(0),
    platformFee: userFee,
  };
}

/** Reconcile split at completion using actual Binance `transactionFee` from history. */
export async function finalizeUsdtWithdrawFeeSplit(args: {
  network: NetworkId;
  userFeeUsdt: number;
  actualBinanceFeeUsdt?: number | null;
  binanceListFeeUsdt?: number | null;
}): Promise<WithdrawFeeSplit> {
  const listFee =
    args.binanceListFeeUsdt ??
    (await resolveBinanceUsdtWithdrawFee(args.network)) ??
    0;

  let actualFee = args.actualBinanceFeeUsdt;
  if (actualFee == null || !Number.isFinite(actualFee)) {
    actualFee = listFee;
  }

  return computeWithdrawFeeSplit({
    userFeeUsdt: args.userFeeUsdt,
    binanceFeeUsdt: actualFee,
  });
}
