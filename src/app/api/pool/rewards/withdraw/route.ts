import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import { withdrawLpPoolRewardsForPosition } from "@/lib/lp-pool-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const positionId = String(body.positionId ?? "").trim();
  if (!positionId) {
    return NextResponse.json({ message: "positionId is required" }, { status: 400 });
  }
  const out = await withdrawLpPoolRewardsForPosition({ userId: u.id, positionId });
  if (!out.ok) {
    return NextResponse.json({ message: out.message }, { status: 400 });
  }
  return NextResponse.json(out);
}

