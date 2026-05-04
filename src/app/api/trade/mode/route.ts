import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getTradeModeSnapshot } from "@/lib/trade-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const snap = await getTradeModeSnapshot(userId);
  if (!snap) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(snap);
}
