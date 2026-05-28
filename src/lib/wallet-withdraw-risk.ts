import { and, desc, eq, gte } from "drizzle-orm";
import {
  getDb,
  withdrawalAddressWhitelist,
  withdrawalRiskEvents,
  withdrawals,
} from "@/db";

export type WithdrawRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export async function scoreWithdrawalRisk(args: {
  userId: string;
  withdrawalId: string;
  asset: string;
  networkCanonical: string;
  address: string;
  amountNum: number;
  deviceId?: string | null;
}): Promise<{ score: number; level: WithdrawRiskLevel; reasons: string[] }> {
  const db = getDb();
  let score = 0;
  const reasons: string[] = [];

  const [wl] = await db
    .select()
    .from(withdrawalAddressWhitelist)
    .where(
      and(
        eq(withdrawalAddressWhitelist.userId, args.userId),
        eq(withdrawalAddressWhitelist.asset, args.asset),
        eq(withdrawalAddressWhitelist.networkCanonical, args.networkCanonical),
        eq(withdrawalAddressWhitelist.address, args.address),
        eq(withdrawalAddressWhitelist.status, "approved"),
      ),
    )
    .limit(1);

  if (!wl) {
    score += 35;
    reasons.push("new_address");
  }
  if (wl?.cooldownUntil && wl.cooldownUntil.getTime() > Date.now()) {
    score += 25;
    reasons.push("address_cooldown");
  }
  if (args.amountNum >= 2_000) {
    score += 45;
    reasons.push("very_large_amount");
  } else if (args.amountNum >= 500) {
    score += 25;
    reasons.push("large_amount");
  }
  if (args.amountNum >= 100) {
    score += 10;
    reasons.push("mid_amount");
  }
  if (!args.deviceId || args.deviceId.length < 8) {
    score += 20;
    reasons.push("unknown_device");
  }

  const recent = await db
    .select()
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.userId, args.userId),
        gte(withdrawals.createdAt, new Date(Date.now() - 24 * 3600_000)),
      ),
    )
    .orderBy(desc(withdrawals.createdAt))
    .limit(5);
  if (recent.length >= 3) {
    score += 15;
    reasons.push("high_frequency");
  }

  const level: WithdrawRiskLevel =
    score >= 75 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";

  await db.insert(withdrawalRiskEvents).values({
    withdrawalId: args.withdrawalId,
    userId: args.userId,
    score,
    level,
    reasons,
    meta: { deviceId: args.deviceId ?? null, amount: args.amountNum },
  });

  return { score, level, reasons };
}
