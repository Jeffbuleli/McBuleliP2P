import { NextResponse } from "next/server";
import { getUserKycLegalIdentity } from "@/lib/kyc-identity";
import { getSessionUserId } from "@/lib/session";

/** Read-only Didit OCR identity — names are not edited locally. */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const identity = await getUserKycLegalIdentity(userId);
  return NextResponse.json({ ok: true, identity });
}
