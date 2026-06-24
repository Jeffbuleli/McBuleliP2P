import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getP2pMakerDashboard } from "@/lib/p2p-merchant-service";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dashboard = await getP2pMakerDashboard(userId);
  return NextResponse.json({ dashboard });
}
