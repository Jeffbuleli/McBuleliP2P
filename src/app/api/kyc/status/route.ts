import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { getSessionUserId } from "@/lib/session";
import {
  kycEnabled,
  kycRequiredCountries,
  isKycApproved,
} from "@/lib/kyc-policy";
import { metamapClientId, metamapConfigured, metamapFlowId } from "@/lib/metamap/config";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [u] = await db
    .select({
      kycStatus: users.kycStatus,
      countryCode: users.countryCode,
      kycUpdatedAt: users.kycUpdatedAt,
      kycRejectionNote: users.kycRejectionNote,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const cc = (u?.countryCode ?? "").trim().toUpperCase();
  const enabled = kycEnabled();
  const corridor = enabled && cc && cc !== "OTHER" && kycRequiredCountries().includes(cc);

  return NextResponse.json({
    enabled,
    corridor,
    kycStatus: u?.kycStatus ?? "none",
    approved: isKycApproved(u?.kycStatus),
    countryCode: u?.countryCode ?? null,
    kycUpdatedAt: u?.kycUpdatedAt?.toISOString() ?? null,
    rejectionNote: u?.kycRejectionNote ?? null,
    metamap: {
      configured: metamapConfigured(),
      clientId: metamapClientId() || null,
      flowId: metamapFlowId() || null,
    },
  });
}
