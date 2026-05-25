import { and, eq, inArray } from "drizzle-orm";
import { getDb, groupSavingsMemberships } from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import {
  normalizeGranularAssignments,
  type GranularRoleId,
} from "@/lib/avec/governance/granular-roles";

/** Apply granular role assignments after a passed collective vote. */
export async function applyGranularRolesToGroup(args: {
  groupId: string;
  actorUserId: string;
  assignments: unknown;
  proposalId?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const rows = normalizeGranularAssignments(args.assignments);
  if (rows.length === 0) {
    return { ok: false, message: "group_gov_invalid_granular_roles" };
  }
  if (rows.length > 25) {
    return { ok: false, message: "group_gov_invalid_granular_roles" };
  }

  const db = getDb();
  const ids = rows.map((r) => r.userId);
  const members = await db
    .select({
      id: groupSavingsMemberships.id,
      userId: groupSavingsMemberships.userId,
      role: groupSavingsMemberships.role,
      status: groupSavingsMemberships.status,
    })
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, args.groupId),
        inArray(groupSavingsMemberships.userId, ids),
      ),
    );

  if (members.length !== ids.length) {
    return { ok: false, message: "group_gov_invalid_granular_roles" };
  }
  if (members.some((m) => m.status !== "approved" || m.role === "admin")) {
    return { ok: false, message: "group_gov_invalid_granular_roles" };
  }

  const byUser = new Map(rows.map((r) => [r.userId, r.granularRoles]));

  for (const m of members) {
    const roles: GranularRoleId[] = byUser.get(m.userId) ?? [];
    await db
      .update(groupSavingsMemberships)
      .set({ granularRoles: roles, updatedAt: new Date() })
      .where(eq(groupSavingsMemberships.id, m.id));
  }

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "gov_granular_roles_applied",
    after: {
      proposalId: args.proposalId,
      assignments: rows,
    },
  });

  return { ok: true };
}
