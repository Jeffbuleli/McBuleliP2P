import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getEavecMerchantDashboard } from "@/lib/eavec-market/merchant";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dash = await getEavecMerchantDashboard(userId);
  if (!dash) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(dash);
}
