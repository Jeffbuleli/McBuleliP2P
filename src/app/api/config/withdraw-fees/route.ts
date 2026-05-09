import { NextResponse } from "next/server";
import {
  EXTERNAL_WITHDRAW_FEE_PI,
  EXTERNAL_WITHDRAW_FEE_USDT,
  MIN_WITHDRAW_NET_PI,
  MIN_WITHDRAW_NET_USDT,
} from "@/lib/withdraw-fees";
import {
  depositValidationSlaHours,
  withdrawalSlaHours,
} from "@/lib/manual-ops-sla";

/** Fixed platform fee + minimum net withdrawal (no secrets). */
export async function GET() {
  return NextResponse.json({
    feeUsdt: EXTERNAL_WITHDRAW_FEE_USDT,
    minNetUsdt: MIN_WITHDRAW_NET_USDT,
    feePi: EXTERNAL_WITHDRAW_FEE_PI,
    minNetPi: MIN_WITHDRAW_NET_PI,
    withdrawalSlaHours: withdrawalSlaHours(),
    depositValidationSlaHours: depositValidationSlaHours(),
  });
}
