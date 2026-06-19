import { count, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { depositLaunchRewards, getDb, users } from "@/db";
import { cdfPerOneUsd } from "@/lib/fx";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { applyUsdtCreditWithAutoRepay } from "@/lib/loans-service";
import { createUserNotification } from "@/lib/notifications-service";
import { fmtWalletAmount } from "@/lib/wallet-types";

export const DEPOSIT_LAUNCH_REWARD_USDT = 5;
export const DEPOSIT_LAUNCH_MIN_USD = 20;
export const DEPOSIT_LAUNCH_MIN_USDT = 20;
export const DEPOSIT_LAUNCH_MOMO_SLOTS = 5;
export const DEPOSIT_LAUNCH_USDT_SLOTS = 5;
export const DEPOSIT_LAUNCH_MAX_TOTAL = 10;

export function depositLaunchCampaignActive(now = Date.now()): boolean {
  const off = process.env.DEPOSIT_LAUNCH_ENABLED?.trim().toLowerCase();
  if (off === "false" || off === "0") return false;
  const startRaw = process.env.DEPOSIT_LAUNCH_START_ISO?.trim();
  if (!startRaw) return false;
  const start = Date.parse(startRaw);
  if (!Number.isFinite(start)) return false;
  const hours = Number(process.env.DEPOSIT_LAUNCH_HOURS ?? "72");
  const durationMs = (Number.isFinite(hours) ? hours : 72) * 3600_000;
  return now >= start && now < start + durationMs;
}

function grossToUsd(gross: number, currency: string): number {
  const c = currency.toUpperCase();
  if (c === "USD") return gross;
  if (c === "CDF") return gross / cdfPerOneUsd();
  return gross;
}

export async function getDepositLaunchCampaignStatus(): Promise<{
  active: boolean;
  momoRemaining: number;
  usdtRemaining: number;
  totalAwarded: number;
}> {
  const db = getDb();
  const [momoRow] = await db
    .select({ c: count() })
    .from(depositLaunchRewards)
    .where(eq(depositLaunchRewards.slot, "momo"));
  const [usdtRow] = await db
    .select({ c: count() })
    .from(depositLaunchRewards)
    .where(eq(depositLaunchRewards.slot, "usdt"));
  const momo = Number(momoRow?.c ?? 0);
  const usdt = Number(usdtRow?.c ?? 0);
  return {
    active: depositLaunchCampaignActive(),
    momoRemaining: Math.max(0, DEPOSIT_LAUNCH_MOMO_SLOTS - momo),
    usdtRemaining: Math.max(0, DEPOSIT_LAUNCH_USDT_SLOTS - usdt),
    totalAwarded: momo + usdt,
  };
}

/** Award +5 USDT to early depositors (5 MoMo ≥$20 + 5 USDT ≥20). */
export async function tryAwardDepositLaunchReward(args: {
  userId: string;
  slot: "momo" | "usdt";
  sourceRef: string;
  grossAmount: number;
  currency: string;
}): Promise<{ awarded: boolean; reason?: string }> {
  if (!depositLaunchCampaignActive()) {
    return { awarded: false, reason: "campaign_inactive" };
  }

  const grossUsd =
    args.slot === "usdt"
      ? args.grossAmount
      : grossToUsd(args.grossAmount, args.currency);
  const minUsd = args.slot === "usdt" ? DEPOSIT_LAUNCH_MIN_USDT : DEPOSIT_LAUNCH_MIN_USD;
  if (!Number.isFinite(grossUsd) || grossUsd < minUsd) {
    return { awarded: false, reason: "below_minimum" };
  }

  const db = getDb();
  const status = await getDepositLaunchCampaignStatus();
  if (status.totalAwarded >= DEPOSIT_LAUNCH_MAX_TOTAL) {
    return { awarded: false, reason: "campaign_full" };
  }
  if (args.slot === "momo" && status.momoRemaining <= 0) {
    return { awarded: false, reason: "momo_slots_full" };
  }
  if (args.slot === "usdt" && status.usdtRemaining <= 0) {
    return { awarded: false, reason: "usdt_slots_full" };
  }

  const rewardStr = fmtWalletAmount(DEPOSIT_LAUNCH_REWARD_USDT);
  const batchId = randomUUID();

  try {
    const inserted = await db.transaction(async (tx) => {
      const [existingUser] = await tx
        .select({ id: depositLaunchRewards.id })
        .from(depositLaunchRewards)
        .where(eq(depositLaunchRewards.userId, args.userId))
        .limit(1);
      if (existingUser) return null;

      const slotCount = await tx
        .select({ c: count() })
        .from(depositLaunchRewards)
        .where(eq(depositLaunchRewards.slot, args.slot));
      const slotUsed = Number(slotCount[0]?.c ?? 0);
      const slotMax = args.slot === "momo" ? DEPOSIT_LAUNCH_MOMO_SLOTS : DEPOSIT_LAUNCH_USDT_SLOTS;
      if (slotUsed >= slotMax) return null;

      const [totalRow] = await tx.select({ c: count() }).from(depositLaunchRewards);
      if (Number(totalRow?.c ?? 0) >= DEPOSIT_LAUNCH_MAX_TOTAL) return null;

      const [row] = await tx
        .insert(depositLaunchRewards)
        .values({
          userId: args.userId,
          slot: args.slot,
          sourceRef: args.sourceRef,
          rewardUsdt: rewardStr,
          grossUsd: fmtWalletAmount(grossUsd),
        })
        .onConflictDoNothing()
        .returning({ id: depositLaunchRewards.id });
      if (!row) return null;

      const applied = await applyUsdtCreditWithAutoRepay(tx, {
        userId: args.userId,
        creditUsdtStr: rewardStr,
        source: "deposit_launch_reward",
        meta: { slot: args.slot, sourceRef: args.sourceRef },
      });
      if (Number(applied.walletCreditUsdtStr) > 0) {
        await tx
          .update(users)
          .set({
            balance: sql`${users.balance} + ${applied.walletCreditUsdtStr}::numeric`,
          })
          .where(eq(users.id, args.userId));
      }

      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: args.userId,
          entryType: "deposit_launch_reward",
          asset: "USDT",
          amount: applied.walletCreditUsdtStr,
          feeUsdEquivalent: "0",
          meta: {
            slot: args.slot,
            sourceRef: args.sourceRef,
            campaign: "deposit_launch_72h",
          },
        },
      ]);

      return row;
    });

    if (!inserted) return { awarded: false, reason: "not_eligible" };

    await createUserNotification({
      userId: args.userId,
      kind: "deposit_launch_reward",
      payload: { rewardUsdt: rewardStr, slot: args.slot },
    }).catch(() => null);

    return { awarded: true };
  } catch {
    return { awarded: false, reason: "error" };
  }
}
