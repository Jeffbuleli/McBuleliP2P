import { and, eq, gt, sql } from "drizzle-orm";
import { getDb, withdrawals } from "@/db";
import {
  binanceUsdtNetworkWithdrawConfig,
  isKnownBinanceInternalWithdrawAddress,
  normalizeWithdrawAddressForNetwork,
  withdrawAddressCacheKey,
} from "@/lib/binance";
import type { NetworkId } from "@/lib/networks";
import { WithdrawalStatus } from "@/lib/status";
import {
  DEFAULT_BINANCE_WITHDRAW_INTERNAL_MIN_USDT,
  DEFAULT_BINANCE_WITHDRAW_MIN_USDT,
  EXTERNAL_WITHDRAW_FEE_USDT,
} from "@/lib/withdraw-fees";

export type UsdtWithdrawQuote = {
  isInternal: boolean;
  userFeeUsdt: number;
  minNetUsdt: number;
  binanceListFeeUsdt: number;
  binanceWithdrawMin: number;
  binanceWithdrawInternalMin: number;
};

async function isInternalFromDb(args: {
  network: NetworkId;
  address: string;
}): Promise<boolean> {
  const key = withdrawAddressCacheKey(args.network, args.address);
  const db = getDb();
  const rows = await db
    .select({
      networkCanonical: withdrawals.networkCanonical,
      toAddress: withdrawals.toAddress,
    })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.asset, "USDT"),
        eq(withdrawals.status, WithdrawalStatus.COMPLETED),
        sql`${withdrawals.fee}::numeric = 0`,
        gt(withdrawals.platformFee, sql`0`),
      ),
    )
    .limit(200);
  for (const row of rows) {
    const net = row.networkCanonical as NetworkId;
    if (
      withdrawAddressCacheKey(net, row.toAddress) === key
    ) {
      return true;
    }
  }
  return false;
}

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
  let isInternal = false;
  if (normalized.length >= 10) {
    isInternal =
      (await isKnownBinanceInternalWithdrawAddress({
        network: args.network,
        address: args.address,
      })) ||
      (await isInternalFromDb({
        network: args.network,
        address: args.address,
      }));
  }

  const userFeeUsdt = isInternal ? 0 : EXTERNAL_WITHDRAW_FEE_USDT;
  const minNetUsdt = isInternal
    ? config.withdrawInternalMin
    : config.withdrawMin;

  return {
    isInternal,
    userFeeUsdt,
    minNetUsdt,
    binanceListFeeUsdt: config.withdrawFee,
    binanceWithdrawMin: config.withdrawMin,
    binanceWithdrawInternalMin: config.withdrawInternalMin,
  };
}
