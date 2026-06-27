import { NextResponse } from "next/server";
import {
  kycIdentityCorrectionRequestZ,
  requestUserKycIdentityCorrection,
} from "@/lib/kyc-identity";
import { getSessionUserId } from "@/lib/session";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = kycIdentityCorrectionRequestZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "profile_invalid_input" }, { status: 400 });
  }

  try {
    const correction = await requestUserKycIdentityCorrection(userId, parsed.data);
    return NextResponse.json({ ok: true, correction });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "profile_invalid_input";
    if (
      msg === "kyc_identity_correction_unavailable" ||
      msg === "kyc_identity_correction_pending_error"
    ) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: "profile_invalid_input" }, { status: 400 });
  }
}
