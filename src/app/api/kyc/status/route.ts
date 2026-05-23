import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getKycStatusPayload } from "@/lib/kyc-status-payload";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getKycStatusPayload(userId);
  if (!payload) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  return NextResponse.json(payload);
}
