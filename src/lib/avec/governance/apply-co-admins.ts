import { and, eq, inArray } from "drizzle-orm";
import { getDb, groupSavingsMemberships } from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";
/** Apply co-admin list after a passed collective vote (internal only). */
export async function applyCoAdminsToGroup(args: {
  groupId: string;
  actorUserId: string;
  coAdminUserIds: string[];
  proposalId?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getDb();
  const ids = Array.from(new Set(args.coAdminUserIds)).slice(0, 3);

  const members = await db
    .select()
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, args.groupId),
        inArray(groupSavingsMemberships.userId, ids),
      ),
    );
  if (ids.length > 0 && members.some((m) => m.status !== "approved")) {
    return { ok: false, message: "group_invalid_coadmins" };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(groupSavingsMemberships)
      .set({ role: "member", updatedAt: new Date() })
      .where(
        and(
          eq(groupSavingsMemberships.groupId, args.groupId),
          eq(groupSavingsMemberships.role, "co_admin"),
        ),
      );

    for (const uid of ids) {
      const row = members.find((m) => m.userId === uid);
      if (!row || row.role === "admin") continue;
      await tx
        .update(groupSavingsMemberships)
        .set({ role: "co_admin", updatedAt: new Date() })
        .where(eq(groupSavingsMemberships.id, row.id));
    }
  });

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "gov_co_admins_applied",
    after: { coAdmins: ids, proposalId: args.proposalId },
  });

  return { ok: true };
}
