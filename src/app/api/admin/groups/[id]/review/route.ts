import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, groupSavingsGroups } from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { nextBillingAtFixedDay } from "@/lib/group-savings-billing";
import { requireStaff, StaffAuthError, getSessionUser } from "@/lib/session-user";

const bodyZ = z.object({
  decision: z.enum(["approve", "reject"]),
  rejectionReason: z.string().max(2000).optional().nullable(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaff();
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
        status: "approved",
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
      after: { status: "approved" },
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
  return NextResponse.json({ ok: true });
}

