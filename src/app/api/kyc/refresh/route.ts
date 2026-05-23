import { NextResponse } from "next/server";
import { getKycStatusPayload } from "@/lib/kyc-status-payload";
import { refreshUserKycFromDidit } from "@/lib/didit/refresh-user-kyc";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Poll Didit decision API for the user's session and update kyc_status. */
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await refreshUserKycFromDidit(userId);
  const payload = await getKycStatusPayload(userId);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, kyc: payload },
      { status: result.error === "didit_api_not_configured" ? 503 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    outcome: result.outcome,
    kyc: payload,
  });
}
