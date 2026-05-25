import { and, eq, inArray } from "drizzle-orm";
import { getDb, groupSavingsMemberships } from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";

/** Apply committee member list after a passed collective vote. */
export async function applyCommitteeToGroup(args: {
  groupId: string;
  actorUserId: string;
  committeeUserIds: string[];
  proposalId?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getDb();
  const ids = Array.from(new Set(args.committeeUserIds)).slice(0, 7);

  if (ids.length > 0) {
    const members = await db
      .select({ status: groupSavingsMemberships.status, role: groupSavingsMemberships.role })
      .from(groupSavingsMemberships)
      .where(
        and(
          eq(groupSavingsMemberships.groupId, args.groupId),
          inArray(groupSavingsMemberships.userId, ids),
        ),
      );
    if (members.length !== ids.length || members.some((m) => m.status !== "approved")) {
      return { ok: false, message: "group_invalid_committee" };
    }
    if (members.some((m) => m.role === "admin")) {
      return { ok: false, message: "group_invalid_committee" };
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(groupSavingsMemberships)
      .set({ role: "member", updatedAt: new Date() })
      .where(
        and(
          eq(groupSavingsMemberships.groupId, args.groupId),
          eq(groupSavingsMemberships.role, "committee"),
        ),
      );

    for (const uid of ids) {
      await tx
        .update(groupSavingsMemberships)
        .set({ role: "committee", updatedAt: new Date() })
        .where(
          and(
            eq(groupSavingsMemberships.groupId, args.groupId),
            eq(groupSavingsMemberships.userId, uid),
          ),
        );
    }
  });

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "gov_committee_applied",
    after: { committee: ids, proposalId: args.proposalId },
  });

  return { ok: true };
}
