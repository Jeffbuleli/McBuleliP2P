import { eq } from "drizzle-orm";
import { getDb, withdrawals } from "@/db";
import { WithdrawalStatus } from "@/lib/status";
import { walletWithdrawAutoEnabled } from "@/lib/usdt-wallet-features";
import { scoreWithdrawalRisk } from "@/lib/wallet-withdraw-risk";
import {
  enqueueWithdrawalJob,
  type WithdrawDecision,
} from "@/lib/wallet-withdraw-queue";

export type WithdrawAutomationOutcome = {
  status: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskScore: number;
  messageKey:
    | "withdraw_auto_low"
    | "withdraw_auto_medium"
    | "withdraw_manual_review";
};

const AUTO_IMMEDIATE_MAX_USDT = 500;

export async function applyUsdtWithdrawalAutomation(args: {
  userId: string;
  withdrawalId: string;
  networkCanonical: string;
  address: string;
  amountNet: string;
  deviceId?: string | null;
  stepUpVerified?: boolean;
}): Promise<WithdrawAutomationOutcome | null> {
  if (!walletWithdrawAutoEnabled()) return null;

  const amountNum = Number(args.amountNet);
  const db = getDb();

  /** Verified withdrawals up to 500 USDT go straight to the auto worker queue. */
  if (
    args.stepUpVerified &&
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    amountNum <= AUTO_IMMEDIATE_MAX_USDT
  ) {
    const status = WithdrawalStatus.QUEUED;
    await db
      .update(withdrawals)
      .set({ status })
      .where(eq(withdrawals.id, args.withdrawalId));
    await enqueueWithdrawalJob({
      withdrawalId: args.withdrawalId,
      decision: "AUTO_NOW",
    });
    return {
      status,
      riskLevel: "LOW",
      riskScore: 0,
      messageKey: "withdraw_auto_low",
    };
  }

  const risk = await scoreWithdrawalRisk({
    userId: args.userId,
    withdrawalId: args.withdrawalId,
    asset: "USDT",
    networkCanonical: args.networkCanonical,
    address: args.address,
    amountNum: Number.isFinite(amountNum) ? amountNum : 0,
    deviceId: args.deviceId,
    stepUpVerified: args.stepUpVerified,
  });

  let status: string = WithdrawalStatus.PENDING_AGENT;
  let decision: WithdrawDecision | null = null;
  let messageKey: WithdrawAutomationOutcome["messageKey"] = "withdraw_manual_review";

  if (risk.level === "LOW") {
    status = WithdrawalStatus.QUEUED;
    decision = "AUTO_NOW";
    messageKey = "withdraw_auto_low";
  } else if (risk.level === "MEDIUM") {
    status = WithdrawalStatus.DELAYED_BATCH;
    decision = "DELAYED_BATCH";
    messageKey = "withdraw_auto_medium";
  }

  await db
    .update(withdrawals)
    .set({ status })
    .where(eq(withdrawals.id, args.withdrawalId));

  if (decision) {
    await enqueueWithdrawalJob({
      withdrawalId: args.withdrawalId,
      decision,
    });
  }

  return {
    status,
    riskLevel: risk.level,
    riskScore: risk.score,
    messageKey,
  };
}
