import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listSimpleOptions } from "@/lib/trade-options-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orders = await listSimpleOptions(userId);
  return NextResponse.json({ orders });
}
