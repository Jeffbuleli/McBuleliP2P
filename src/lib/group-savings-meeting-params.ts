import { eq } from "drizzle-orm";
import { getDb, groupSavingsGroups } from "@/db";
import { validateSocialFundPerMeeting } from "@/lib/avec/social-fund-limits";
import { govCollectiveRequired } from "@/lib/avec/governance/enforcement";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { hasRole, getMyMembershipOrNull } from "@/lib/group-savings-permissions";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";
import { AVEC_MAX_SHARES_PER_MEETING } from "@/lib/group-savings-types";

/** Apply social fund after a passed collective vote (no manager shortcut). */
export async function applyGroupSocialFundFromGovernance(args: {
  groupId: string;
  actorUserId: string;
  socialFundUsdt: number;
  proposalId?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getDb();
  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1);
  if (!g) return { ok: false, message: "group_not_found" };

  const shareValue = numFromNumeric(g.contributionAmountUsdt?.toString());
  const maxShares = g.maxSharesPerMeeting ?? AVEC_MAX_SHARES_PER_MEETING;
  const err = validateSocialFundPerMeeting(args.socialFundUsdt, shareValue, maxShares);
  if (err) return { ok: false, message: err };

  const socialStr = fmtWalletAmount(args.socialFundUsdt);
  await db
    .update(groupSavingsGroups)
    .set({ socialFundUsdt: socialStr, updatedAt: new Date() })
    .where(eq(groupSavingsGroups.id, args.groupId));

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "gov_social_fund_changed",
    after: { socialFundUsdt: args.socialFundUsdt, proposalId: args.proposalId },
  });

  return { ok: true };
}

export async function updateGroupMeetingParams(args: {
  groupId: string;
  actorUserId: string;
  socialFundUsdt: number;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const actor = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.actorUserId,
  });
  if (!hasRole(actor, ["admin"])) {
    return { ok: false, message: "group_forbidden" };
  }
  return govCollectiveRequired();
}
