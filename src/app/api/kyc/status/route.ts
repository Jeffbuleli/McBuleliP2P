import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getKycStatusPayload } from "@/lib/kyc-status-payload";
import { reconcileKycOnStatusRead } from "@/lib/didit/reconcile-kyc-on-read";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await reconcileKycOnStatusRead(userId);
  const payload = await getKycStatusPayload(userId);
  if (!payload) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  return NextResponse.json(payload);
}
