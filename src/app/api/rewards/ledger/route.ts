import { NextResponse } from "next/server";
import {
  countRewardPointLedger,
  listRewardPointLedger,
} from "@/lib/reward-points-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 10), 1), 50);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  const [ledger, total] = await Promise.all([
    listRewardPointLedger(userId, limit, offset),
    countRewardPointLedger(userId),
  ]);

  return NextResponse.json({ ledger, total, limit, offset });
}
