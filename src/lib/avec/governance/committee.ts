import { and, eq, inArray } from "drizzle-orm";
import { getDb, groupSavingsMemberships } from "@/db";
import { listGroupManagers } from "@/lib/group-savings-payouts";

/** Approved members with role committee (3–7 typical). */
export async function listCommitteeMembers(groupId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ userId: groupSavingsMemberships.userId })
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, groupId),
        eq(groupSavingsMemberships.status, "approved"),
        eq(groupSavingsMemberships.role, "committee"),
      ),
    );
  return rows.map((r) => r.userId);
}

/**
 * Eligible voters for tier B. If no committee is configured, falls back to managers
 * so groups are never blocked.
 */
export async function countCommitteeEligibleVoters(groupId: string): Promise<number> {
  const committee = await listCommitteeMembers(groupId);
  if (committee.length > 0) return committee.length;
  const managers = await listGroupManagers(groupId);
  return Math.max(1, managers.length);
}

export async function canVoteAsCommittee(args: {
  groupId: string;
  userId: string;
}): Promise<boolean> {
  const committee = await listCommitteeMembers(args.groupId);
  if (committee.length > 0) {
    return committee.includes(args.userId);
  }
  const managers = await listGroupManagers(args.groupId);
  return managers.some((m) => m.userId === args.userId);
}
