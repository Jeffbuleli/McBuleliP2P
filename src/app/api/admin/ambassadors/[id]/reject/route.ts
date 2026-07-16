import { NextResponse } from "next/server";
import { z } from "zod";
import {
  PlatformAdminAuditAction,
  writePlatformAdminAudit,
} from "@/lib/admin-audit";
import { rejectAmbassadorApplication } from "@/lib/community/ambassador-service";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";

export const dynamic = "force-dynamic";

const bodyZ = z.object({
  reason: z.string().trim().min(2).max(1000),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let staff;
  try {
    staff = await requireSuperAdmin();
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ message: msg }, { status: 403 });
  }

  const parsed = bodyZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "amb_reason_required" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const result = await rejectAmbassadorApplication({
    applicationId: id,
    staffUserId: staff.id,
    reason: parsed.data.reason,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.code }, { status: 400 });
  }

  await writePlatformAdminAudit({
    actorUserId: staff.id,
    action: PlatformAdminAuditAction.AMBASSADOR_REJECT,
    resourceType: "ambassador_application",
    resourceId: id,
    meta: { reason: parsed.data.reason },
  });

  return NextResponse.json({ ok: true });
}
