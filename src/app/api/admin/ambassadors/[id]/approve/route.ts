import { NextResponse } from "next/server";
import {
  PlatformAdminAuditAction,
  writePlatformAdminAudit,
} from "@/lib/admin-audit";
import { approveAmbassadorApplication } from "@/lib/community/ambassador-service";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let staff;
  try {
    staff = await requireSuperAdmin();
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ message: msg }, { status: 403 });
  }

  const { id } = await ctx.params;
  const result = await approveAmbassadorApplication({
    applicationId: id,
    staffUserId: staff.id,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.code }, { status: 400 });
  }

  await writePlatformAdminAudit({
    actorUserId: staff.id,
    action: PlatformAdminAuditAction.AMBASSADOR_APPROVE,
    resourceType: "ambassador_application",
    resourceId: id,
  });

  return NextResponse.json({ ok: true });
}
