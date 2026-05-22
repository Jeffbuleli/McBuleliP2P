import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { userHasAvecSubscriptionWaiver } from "@/lib/group-savings-subscription-waiver";
import { GROUP_SUBSCRIPTION_FEE_USDT } from "@/lib/group-savings-types";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const feeWaived = await userHasAvecSubscriptionWaiver(userId);
  return NextResponse.json({
    ok: true,
    feeUsdt: GROUP_SUBSCRIPTION_FEE_USDT,
    feeWaived,
    billingSource: "group_treasury",
  });
}
