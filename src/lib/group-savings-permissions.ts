import { and, eq } from "drizzle-orm";
import { getDb, groupSavingsGroups, groupSavingsMemberships } from "@/db";
import type { GroupMembershipRole } from "@/lib/group-savings-types";

export async function getGroupOrNull(groupId: string) {
  const db = getDb();
  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, groupId))
    .limit(1);
  return g ?? null;
}

export async function getMyMembershipOrNull(args: {
  groupId: string;
  userId: string;
}) {
  const db = getDb();
  const [m] = await db
    .select()
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, args.groupId),
        eq(groupSavingsMemberships.userId, args.userId),
      ),
    )
    .limit(1);
  return m ?? null;
}

export { hasRole } from "@/lib/avec/governance/membership-roles";
export type { MembershipLike } from "@/lib/avec/governance/permission-engine";
export {
  canManageGroupLoans,
  canModerateGroupDialogue,
  canModerateGroupMembership,
  canProposeGovernancePolicy,
  canProposeGroupLoan,
  canProposeGroupPayout,
  hasGranularRole,
  isGroupManager,
  membershipGranularRoles,
} from "@/lib/avec/governance/permission-engine";

