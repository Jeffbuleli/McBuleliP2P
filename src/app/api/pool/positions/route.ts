import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import {
  createLpPoolPosition,
  getLpPoolAccruedForLatest24hWindow,
  getLpPoolRewardBalance,
  listLpPoolPositions,
} from "@/lib/lp-pool-service";
import { poolNewDepositsEnabled } from "@/lib/pool-features";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getSessionUser();
  if (!u) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const [positions, bal, today] = await Promise.all([
    listLpPoolPositions(u.id),
    getLpPoolRewardBalance(u.id),
    getLpPoolAccruedForLatest24hWindow({ userId: u.id }),
  ]);
  return NextResponse.json({
    positions,
    balance: bal,
    today,
    features: { newDepositsEnabled: poolNewDepositsEnabled() },
  });
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const amountUsdtStr = String(body.amountUsdt ?? "").trim();
  const lockMonths = Number(body.lockMonths ?? 0);
  const out = await createLpPoolPosition({ userId: u.id, amountUsdtStr, lockMonths });
  if (!out.ok) {
    return NextResponse.json({ message: out.message }, { status: 400 });
  }
  return NextResponse.json(out);
}

