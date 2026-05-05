import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffScope, StaffAuthError } from "@/lib/session-user";
import {
  PlatformAdminAuditAction,
  writePlatformAdminAudit,
} from "@/lib/admin-audit";
import { processGroupSubscriptionBilling } from "@/lib/group-savings-billing";

const bodyZ = z.object({
  groupId: z.string().uuid(),
});

export async function POST(req: Request) {
  let staff;
  try {
    staff = await requireStaffScope("groups");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }
  const r = await processGroupSubscriptionBilling({ groupId: parsed.data.groupId });
  if (!r.ok) return NextResponse.json({ message: r.message }, { status: 400 });

  await writePlatformAdminAudit({
    actorUserId: staff.id,
    action: PlatformAdminAuditAction.GROUP_SUBSCRIPTION_BILLING_RUN,
    resourceType: "group",
    resourceId: parsed.data.groupId,
    meta: { status: r.status },
  });

  return NextResponse.json(r);
}

