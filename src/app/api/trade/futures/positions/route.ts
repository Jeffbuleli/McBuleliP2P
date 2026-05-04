import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listFuturesPositions } from "@/lib/trade-futures-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await listFuturesPositions(userId);
  return NextResponse.json(data);
}
