import {
  binanceUsdtNetworkWithdrawConfig,
  resolveBinanceWithdrawIsInternal,
  normalizeWithdrawAddressForNetwork,
} from "@/lib/binance";
import type { NetworkId } from "@/lib/networks";
import {
  DEFAULT_BINANCE_WITHDRAW_INTERNAL_MIN_USDT,
  DEFAULT_BINANCE_WITHDRAW_MIN_USDT,
  EXTERNAL_WITHDRAW_FEE_USDT,
  MCBULELI_MIN_WITHDRAW_NET_EXTERNAL_USDT,
  MCBULELI_MIN_WITHDRAW_NET_INTERNAL_USDT,
} from "@/lib/withdraw-fees";

export type UsdtWithdrawQuote = {
  isInternal: boolean;
  userFeeUsdt: number;
  minNetUsdt: number;
  binanceListFeeUsdt: number;
  binanceWithdrawMin: number;
  binanceWithdrawInternalMin: number;
};


/** Quote user fee + minimum net from Binance config and internal-address detection. */
export async function resolveUsdtWithdrawQuote(args: {
  network: NetworkId;
  address: string;
}): Promise<UsdtWithdrawQuote> {
  let config = {
    withdrawFee: 0,
    withdrawMin: DEFAULT_BINANCE_WITHDRAW_MIN_USDT,
    withdrawInternalMin: DEFAULT_BINANCE_WITHDRAW_INTERNAL_MIN_USDT,
    withdrawTag: false,
  };
  try {
    config = await binanceUsdtNetworkWithdrawConfig(args.network);
  } catch {
    /* fall back to defaults */
  }

  const normalized = normalizeWithdrawAddressForNetwork(
    args.network,
    args.address,
  );
  const isInternal =
    normalized.length >= 10
      ? await resolveBinanceWithdrawIsInternal({
          network: args.network,
          address: args.address,
        })
      : false;

  const userFeeUsdt = EXTERNAL_WITHDRAW_FEE_USDT;
  const minNetUsdt = isInternal
    ? MCBULELI_MIN_WITHDRAW_NET_INTERNAL_USDT
    : MCBULELI_MIN_WITHDRAW_NET_EXTERNAL_USDT;

  return {
    isInternal,
    userFeeUsdt,
    minNetUsdt,
    binanceListFeeUsdt: config.withdrawFee,
    binanceWithdrawMin: config.withdrawMin,
    binanceWithdrawInternalMin: config.withdrawInternalMin,
  };
}
