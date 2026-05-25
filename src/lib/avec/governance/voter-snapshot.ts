import { and, eq, lte, sql } from "drizzle-orm";
import { getDb, groupSavingsMemberships } from "@/db";
import { countCommitteeEligibleVoters } from "@/lib/avec/governance/committee";

/** Approved members eligible at vote open (excludes joins after voteOpensAt). */
export async function countEligibleVotersAt(args: {
  groupId: string;
  voteAudience: string;
  asOf: Date;
}): Promise<number> {
  const db = getDb();
  if (args.voteAudience === "committee") {
    const rows = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(groupSavingsMemberships)
      .where(
        and(
          eq(groupSavingsMemberships.groupId, args.groupId),
          eq(groupSavingsMemberships.status, "approved"),
          eq(groupSavingsMemberships.role, "committee"),
          lte(groupSavingsMemberships.updatedAt, args.asOf),
        ),
      );
    return rows[0]?.n ?? 0;
  }
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, args.groupId),
        eq(groupSavingsMemberships.status, "approved"),
        lte(groupSavingsMemberships.updatedAt, args.asOf),
      ),
    );
  return rows[0]?.n ?? 0;
}

export async function assertVoterEligibleAt(args: {
  groupId: string;
  userId: string;
  voteAudience: string;
  asOf: Date;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getDb();
  const [m] = await db
    .select({
      status: groupSavingsMemberships.status,
      role: groupSavingsMemberships.role,
      updatedAt: groupSavingsMemberships.updatedAt,
    })
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, args.groupId),
        eq(groupSavingsMemberships.userId, args.userId),
      ),
    )
    .limit(1);
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }
  if (m.updatedAt && m.updatedAt.getTime() > args.asOf.getTime()) {
    return { ok: false, message: "group_gov_voter_not_eligible_snapshot" };
  }
  if (args.voteAudience === "committee" && m.role !== "committee") {
    return { ok: false, message: "group_gov_committee_only" };
  }
  return { ok: true };
}
