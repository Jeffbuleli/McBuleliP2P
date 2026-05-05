import { NextResponse } from "next/server";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, lpPoolDailyDistributions } from "@/db";
import { getSessionUser } from "@/lib/session-user";
import { computeLpPoolShares } from "@/lib/lp-pool-service";

export const dynamic = "force-dynamic";

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function avgRewardPerShare(days: number): Promise<number> {
  const db = getDb();
  const since = new Date(Date.now() - days * 86_400_000);
  const [row] = await db
    .select({
      reward: sql<string>`coalesce(sum(${lpPoolDailyDistributions.rewardPoolUsdt}), 0)::text`,
      shares: sql<string>`coalesce(sum(${lpPoolDailyDistributions.totalShares}), 0)::text`,
    })
    .from(lpPoolDailyDistributions)
    .where(gte(lpPoolDailyDistributions.dayStartAt, since));
  const reward = num(row?.reward ?? "0");
  const shares = num(row?.shares ?? "0");
  if (reward <= 0 || shares <= 0) return 0;
  return reward / shares;
}

export async function GET(req: Request) {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const amountUsdt = Number((searchParams.get("amountUsdt") ?? "").trim().replace(",", "."));
  const lockMonths = Number(searchParams.get("lockMonths") ?? "0");
  const sh = computeLpPoolShares(amountUsdt, lockMonths);
  if (!sh.ok) {
    return NextResponse.json({ message: "Invalid amount or lockMonths" }, { status: 400 });
  }

  const [perShare7, perShare30] = await Promise.all([
    avgRewardPerShare(7),
    avgRewardPerShare(30),
  ]);

  const daily7 = sh.shares * perShare7;
  const daily30 = sh.shares * perShare30;

  const days = lockMonths === 1 ? 30 : lockMonths === 3 ? 90 : 180;
  return NextResponse.json({
    shares: sh.shares,
    sizeTier: sh.sizeTier,
    lockTier: sh.lockTier,
    dailyEstimateUsdt: {
      avg7d: daily7,
      avg30d: daily30,
    },
    totalAtMaturityUsdt: {
      avg7d: daily7 * days,
      avg30d: daily30 * days,
    },
    basis: {
      days7: 7,
      days30: 30,
      lockDaysAssumed: days,
    },
  });
}

