import { NextResponse } from "next/server";
import {
  EXTERNAL_WITHDRAW_FEE_PI,
  EXTERNAL_WITHDRAW_FEE_USDT,
  MIN_WITHDRAW_NET_PI,
  MIN_WITHDRAW_NET_USDT,
} from "@/lib/withdraw-fees";
import { resolveBinanceUsdtWithdrawFee } from "@/lib/withdraw-fee-split";
import type { NetworkId } from "@/lib/networks";
import { getBinanceWalletCredentials } from "@/lib/env";
import {
  depositValidationSlaHours,
  withdrawalSlaHours,
} from "@/lib/manual-ops-sla";

/** Fixed platform fee + minimum net withdrawal (no secrets). */
export async function GET() {
  const binanceFeeByNetwork: Partial<Record<NetworkId, number>> = {};
  try {
    getBinanceWalletCredentials();
    for (const net of ["TRC20", "ERC20", "BEP20"] as NetworkId[]) {
      const fee = await resolveBinanceUsdtWithdrawFee(net);
      if (fee != null) binanceFeeByNetwork[net] = fee;
    }
  } catch {
    /* wallet keys not configured */
  }

  return NextResponse.json({
    feeUsdt: EXTERNAL_WITHDRAW_FEE_USDT,
    minNetUsdt: MIN_WITHDRAW_NET_USDT,
    feePi: EXTERNAL_WITHDRAW_FEE_PI,
    minNetPi: MIN_WITHDRAW_NET_PI,
    binanceFeeByNetwork,
    withdrawalSlaHours: withdrawalSlaHours(),
    depositValidationSlaHours: depositValidationSlaHours(),
  });
}
