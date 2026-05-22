import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, groupSavingsGroups } from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { nextBillingAtFixedDay } from "@/lib/group-savings-billing";
import {
  requireStaffScope,
  StaffAuthError,
  getSessionUser,
} from "@/lib/session-user";
import {
  PlatformAdminAuditAction,
  writePlatformAdminAudit,
} from "@/lib/admin-audit";
import { createUserNotification } from "@/lib/notifications-service";

const bodyZ = z.object({
  decision: z.enum(["approve", "reject"]),
  rejectionReason: z.string().max(2000).optional().nullable(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaffScope("groups");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const me = await getSessionUser();
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  }
  const { id } = await ctx.params;
  const db = getDb();
  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, id))
    .limit(1);
  if (!g) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const now = new Date();
  if (parsed.data.decision === "approve") {
    await db
      .update(groupSavingsGroups)
      .set({
        status: "active",
        subscriptionStatus: "active",
        reviewedByUserId: me?.id ?? null,
        reviewedAt: now,
        rejectionReason: null,
        nextBillingAt: nextBillingAtFixedDay(now),
        updatedAt: now,
      })
      .where(eq(groupSavingsGroups.id, id));
    await writeGroupAudit({
      groupId: id,
      actorUserId: me?.id ?? null,
      action: "ops_approved_group",
      before: { status: g.status },
      after: { status: "active", subscriptionStatus: "active" },
    });
    await createUserNotification({
      userId: g.createdByUserId,
      kind: "group_ops_approved",
      payload: { groupId: id, groupName: g.name },
    });
    await writePlatformAdminAudit({
      actorUserId: me?.id ?? null,
      action: PlatformAdminAuditAction.GROUP_REVIEW,
      resourceType: "group",
      resourceId: id,
      meta: { decision: "approve", groupName: g.name },
    });
    return NextResponse.json({ ok: true });
  }

  const reason = parsed.data.rejectionReason?.trim() || "—";
  await db
    .update(groupSavingsGroups)
    .set({
      status: "rejected",
      reviewedByUserId: me?.id ?? null,
      reviewedAt: now,
      rejectionReason: reason,
      updatedAt: now,
    })
    .where(eq(groupSavingsGroups.id, id));
  await writeGroupAudit({
    groupId: id,
    actorUserId: me?.id ?? null,
    action: "ops_rejected_group",
    before: { status: g.status },
    after: { status: "rejected", rejectionReason: reason },
  });
  await writePlatformAdminAudit({
    actorUserId: me?.id ?? null,
    action: PlatformAdminAuditAction.GROUP_REVIEW,
    resourceType: "group",
    resourceId: id,
    meta: { decision: "reject", rejectionReason: reason, groupName: g.name },
  });
  return NextResponse.json({ ok: true });
}

