import { NextResponse } from "next/server";
import {
  getUserKycLegalIdentity,
  kycIdentityPatchZ,
  resubmitUserKycIdentity,
  updateUserKycLegalIdentity,
} from "@/lib/kyc-identity";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const identity = await getUserKycLegalIdentity(userId);
  return NextResponse.json({ ok: true, identity });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = kycIdentityPatchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "profile_invalid_input" }, { status: 400 });
  }

  try {
    const identity = await updateUserKycLegalIdentity(userId, parsed.data);
    return NextResponse.json({ ok: true, identity });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "profile_invalid_input";
    if (msg === "kyc_identity_locked") {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: "profile_invalid_input" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => ({}));
  const parsed = kycIdentityPatchZ.safeParse(json);
  if (!parsed.success && json && Object.keys(json as object).length > 0) {
    return NextResponse.json({ error: "profile_invalid_input" }, { status: 400 });
  }

  try {
    await resubmitUserKycIdentity(userId, parsed.success ? parsed.data : undefined);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "profile_invalid_input";
    if (
      msg === "kyc_identity_locked" ||
      msg === "kyc_identity_resubmit_unavailable"
    ) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: "profile_invalid_input" }, { status: 400 });
  }
}
