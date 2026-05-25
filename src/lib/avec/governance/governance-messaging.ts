import { getDb, groupMessages } from "@/db";
import type { GovernanceVoteMeta, ProposalType } from "@/lib/avec/governance/types";

export async function insertGovernanceVoteMessage(args: {
  groupId: string;
  actorUserId: string;
  messageType: "vote_started" | "vote_progress" | "vote_closed";
  meta: GovernanceVoteMeta;
}): Promise<void> {
  const db = getDb();
  const body =
    args.messageType === "vote_started"
      ? `GOV_VOTE_OPEN|${args.meta.proposalId}|${args.meta.title}`
      : args.messageType === "vote_progress"
        ? `GOV_VOTE_PROGRESS|${args.meta.proposalId}|${args.meta.yesCount}|${args.meta.noCount}`
        : `GOV_VOTE_CLOSED|${args.meta.proposalId}|${args.meta.result ?? args.meta.status}`;

  await db.insert(groupMessages).values({
    groupId: args.groupId,
    senderUserId: args.actorUserId,
    body,
    messageType: args.messageType,
    meta: args.meta as unknown as Record<string, unknown>,
  });
}

export function proposalTypeLabel(type: ProposalType): string {
  switch (type) {
    case "payout_critical":
      return "Critical payout";
    case "revoke_admin":
      return "Revoke admin";
    case "change_interest_rate":
      return "Change interest rate";
    case "set_co_admins":
      return "Change co-admins";
    case "change_social_fund":
      return "Change social fund";
    case "cycle_closure":
      return "Cycle closure";
    case "loan_critical":
      return "Critical loan";
    default:
      return type;
  }
}
