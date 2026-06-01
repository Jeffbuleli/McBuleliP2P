import { NextResponse } from "next/server";
import { listAdminMcbClaims } from "@/lib/mcb-claim-service";
import { MCB_CLAIM_STATUS, type McbClaimStatus } from "@/lib/mcb-token-config";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ message: msg }, { status: 403 });
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam &&
    (Object.values(MCB_CLAIM_STATUS) as string[]).includes(statusParam)
      ? (statusParam as McbClaimStatus)
      : undefined;

  const claims = await listAdminMcbClaims({ status, limit: 100 });
  return NextResponse.json({ claims });
}
