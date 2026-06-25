import { NextResponse } from "next/server";
import { z } from "zod";
import {
  StaffAuthError,
  getSessionUser,
  requireSuperAdmin,
} from "@/lib/session-user";
import { adminSetTradeLive } from "@/lib/trade-live-governance";
import {
  PlatformAdminAuditAction,
  writePlatformAdminAudit,
} from "@/lib/admin-audit";

const bodyZ = z.object({
  enabled: z.boolean(),
  reason: z.string().max(500).optional().nullable(),
});

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

  const parsed = bodyZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }

  const { id: targetUserId } = await ctx.params;
  const me = await getSessionUser();
  if (!me) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const r = await adminSetTradeLive({
    targetUserId,
    enabled: parsed.data.enabled,
    reason: parsed.data.reason,
    actorUserId: me.id,
  });

  if (!r.ok) {
    return NextResponse.json({ message: r.error }, { status: 400 });
  }

  await writePlatformAdminAudit({
    actorUserId: me.id,
    action: PlatformAdminAuditAction.TRADE_LIVE_UPDATE,
    resourceType: "user",
    resourceId: targetUserId,
    meta: {
      enabled: parsed.data.enabled,
      reason: parsed.data.reason ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
