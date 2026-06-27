import { NextResponse } from "next/server";
import {
  StaffAuthError,
  getSessionUser,
  requireSuperAdmin,
} from "@/lib/session-user";
import {
  PlatformAdminAuditAction,
  writePlatformAdminAudit,
} from "@/lib/admin-audit";
import {
  adminKycIdentityCorrectionZ,
  applyAdminKycIdentityCorrection,
} from "@/lib/kyc-identity";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const parsed = adminKycIdentityCorrectionZ.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  const { id: targetUserId } = await ctx.params;
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await applyAdminKycIdentityCorrection({
      targetUserId,
      adminUserId: me.id,
      body: parsed.data,
    });

    await writePlatformAdminAudit({
      actorUserId: me.id,
      action: PlatformAdminAuditAction.KYC_IDENTITY_CORRECTION,
      resourceType: "user",
      resourceId: targetUserId,
      meta: {
        legalFirstName: parsed.data.legalFirstName,
        legalLastName: parsed.data.legalLastName,
        previousProposedFirstName: result.correction.proposedFirstName,
        previousProposedLastName: result.correction.proposedLastName,
      },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "kyc_identity_correction_unavailable";
    return NextResponse.json({ message: msg }, { status: 400 });
  }
}
