import { and, eq, inArray } from "drizzle-orm";
import { getDb, groupAvecLoans, groupPayoutRequests, groupSavingsGroups } from "@/db";
import { getGroupLentUsdt } from "@/lib/avec/fund-buckets";

export async function assertGroupCanDissolve(groupId: string): Promise<
  | { ok: true }
  | { ok: false; message: string }
> {
  const db = getDb();
  const [g] = await db
    .select({ status: groupSavingsGroups.status, cycleStatus: groupSavingsGroups.cycleStatus })
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, groupId))
    .limit(1);
  if (!g) return { ok: false, message: "group_not_found" };
  if (g.status === "closed") return { ok: false, message: "group_already_closed" };

  const lent = await getGroupLentUsdt(groupId);
  if (lent > 1e-9) return { ok: false, message: "group_dissolve_loans_outstanding" };

  const pendingLoans = await db
    .select({ id: groupAvecLoans.id })
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.groupId, groupId),
        inArray(groupAvecLoans.status, ["pending", "requested", "disbursed"]),
      ),
    )
    .limit(1);
  if (pendingLoans.length > 0) {
    return { ok: false, message: "group_dissolve_loans_pending" };
  }

  const pendingPayouts = await db
    .select({ id: groupPayoutRequests.id })
    .from(groupPayoutRequests)
    .where(
      and(
        eq(groupPayoutRequests.groupId, groupId),
        inArray(groupPayoutRequests.status, ["pending", "approved"]),
      ),
    )
    .limit(1);
  if (pendingPayouts.length > 0) {
    return { ok: false, message: "group_dissolve_payouts_pending" };
  }

  return { ok: true };
}

export async function executeGroupDissolution(args: {
  groupId: string;
  actorUserId: string;
  proposalId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const check = await assertGroupCanDissolve(args.groupId);
  if (!check.ok) return check;

  const db = getDb();
  await db
    .update(groupSavingsGroups)
    .set({
      status: "closed",
      cycleStatus: "closed",
      updatedAt: new Date(),
    })
    .where(eq(groupSavingsGroups.id, args.groupId));

  return { ok: true };
}
