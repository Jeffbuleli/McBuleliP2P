import { NextResponse } from "next/server";
import {
  PlatformAdminAuditAction,
  writePlatformAdminAudit,
} from "@/lib/admin-audit";
import { completeBuildersMembership } from "@/lib/builders/builders-service";
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
  const result = await completeBuildersMembership({
    membershipId: id,
    staffUserId: staff.id,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.code }, { status: 400 });
  }

  await writePlatformAdminAudit({
    actorUserId: staff.id,
    action: PlatformAdminAuditAction.BUILDERS_COMPLETE,
    resourceType: "builders_membership",
    resourceId: id,
  });

  return NextResponse.json({ ok: true });
}
