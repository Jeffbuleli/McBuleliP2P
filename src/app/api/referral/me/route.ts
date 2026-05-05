import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getReferralSnapshot } from "@/lib/referral-service";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const snap = await getReferralSnapshot(userId);
    return NextResponse.json(snap);
  } catch (e) {
    console.error("[referral/me]", e);
    return NextResponse.json({ error: "referral_unavailable" }, { status: 500 });
  }
}
