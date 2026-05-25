import { eq } from "drizzle-orm";
import { getDb, groupSavingsGroups } from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { getMyMembershipOrNull } from "@/lib/group-savings-permissions";
import type { GovernanceMode } from "@/lib/avec/governance/types";

const ALLOWED: GovernanceMode[] = ["legacy", "hybrid", "full"];

export async function setGroupGovernanceMode(args: {
  groupId: string;
  actorUserId: string;
  governanceMode: GovernanceMode;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const m = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.actorUserId,
  });
  if (!m || m.status !== "approved" || m.role !== "admin") {
    return { ok: false, message: "group_forbidden" };
  }
  if (!ALLOWED.includes(args.governanceMode)) {
    return { ok: false, message: "group_invalid_body" };
  }

  const db = getDb();
  const [g] = await db
    .select({
      governanceMode: groupSavingsGroups.governanceMode,
    })
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1);
  if (!g) return { ok: false, message: "group_not_found" };

  const prev = (g.governanceMode ?? "legacy") as GovernanceMode;
  if (prev === args.governanceMode) return { ok: true };

  await db
    .update(groupSavingsGroups)
    .set({
      governanceMode: args.governanceMode,
      updatedAt: new Date(),
    })
    .where(eq(groupSavingsGroups.id, args.groupId));

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "gov_mode_changed",
    before: { governanceMode: prev },
    after: { governanceMode: args.governanceMode },
  });

  return { ok: true };
}
