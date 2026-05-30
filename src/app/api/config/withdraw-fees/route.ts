import { NextResponse } from "next/server";
import {
  EXTERNAL_WITHDRAW_FEE_PI,
  EXTERNAL_WITHDRAW_FEE_USDT,
  MCBULELI_MIN_WITHDRAW_NET_EXTERNAL_USDT,
  MIN_WITHDRAW_NET_PI,
} from "@/lib/withdraw-fees";
import { resolveBinanceUsdtWithdrawFee } from "@/lib/withdraw-fee-split";
import { binanceUsdtNetworkWithdrawConfig } from "@/lib/binance";
import type { NetworkId } from "@/lib/networks";
import { getBinanceWalletCredentials } from "@/lib/env";
import {
  depositValidationSlaHours,
  withdrawalSlaHours,
} from "@/lib/manual-ops-sla";

/** Fixed platform fee + minimum net withdrawal (no secrets). */
export async function GET() {
  const binanceFeeByNetwork: Partial<Record<NetworkId, number>> = {};
  const binanceMinByNetwork: Partial<Record<NetworkId, number>> = {};
  try {
    getBinanceWalletCredentials();
    for (const net of ["TRC20", "ERC20", "BEP20"] as NetworkId[]) {
      const cfg = await binanceUsdtNetworkWithdrawConfig(net);
      binanceFeeByNetwork[net] = cfg.withdrawFee;
      binanceMinByNetwork[net] = cfg.withdrawMin;
    }
  } catch {
    /* wallet keys not configured */
    for (const net of ["TRC20", "ERC20", "BEP20"] as NetworkId[]) {
      const fee = await resolveBinanceUsdtWithdrawFee(net);
      if (fee != null) binanceFeeByNetwork[net] = fee;
    }
  }

  return NextResponse.json({
    feeUsdt: EXTERNAL_WITHDRAW_FEE_USDT,
    minNetUsdt: MCBULELI_MIN_WITHDRAW_NET_EXTERNAL_USDT,
    feePi: EXTERNAL_WITHDRAW_FEE_PI,
    minNetPi: MIN_WITHDRAW_NET_PI,
    binanceFeeByNetwork,
    binanceMinByNetwork,
    withdrawalSlaHours: withdrawalSlaHours(),
    depositValidationSlaHours: depositValidationSlaHours(),
  });
}
