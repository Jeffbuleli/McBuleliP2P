import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  getDb,
  groupAvecLoans,
  groupProposals,
  groupSocialFundRequests,
  groupSavingsGroups,
  groupSavingsMemberships,
  groupWalletLedgerEntries,
  users,
} from "@/db";
import { getGroupFundSummary, fundBucketMeta } from "@/lib/avec/fund-buckets";
import {
  DEFAULT_GOVERNANCE_RULES,
  socialAidProposalType,
} from "@/lib/avec/governance/rules";
import { insertAndStartProposal } from "@/lib/avec/governance/proposal-engine";
import { ensureGroupSubscriptionUpToDate } from "@/lib/group-savings-billing";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { getMyMembershipOrNull } from "@/lib/group-savings-permissions";
import { notifyGroupMembers } from "@/lib/group-savings-notifications";
import { createUserNotification } from "@/lib/notifications-service";
import { p2pDisplayName } from "@/lib/p2p-display";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset } from "@/lib/wallet-move-assets";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";

export const SOCIAL_AID_TYPES = [
  "illness",
  "death",
  "emergency",
  "disaster",
  "maternity",
  "accident",
] as const;

export type SocialAidType = (typeof SOCIAL_AID_TYPES)[number];

export const SOCIAL_AID_MODES = ["grant", "repayable", "partial"] as const;

export type SocialAidMode = (typeof SOCIAL_AID_MODES)[number];

async function userDisplayName(userId: string): Promise<string> {
  const db = getDb();
  const [u] = await db
    .select({
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      piUsername: users.piUsername,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return userId.slice(0, 8);
  return p2pDisplayName({
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    piUsername: u.piUsername,
  });
}

async function assertGroupActive(groupId: string) {
  const db = getDb();
  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, groupId))
    .limit(1);
  if (!g) return { ok: false as const, message: "group_not_found" };
  await ensureGroupSubscriptionUpToDate({ groupId });
  if (g.status !== "active" || g.subscriptionStatus !== "active") {
    return { ok: false as const, message: "group_suspended" };
  }
  if ((g.cycleStatus ?? "active") !== "active") {
    return { ok: false as const, message: "group_cycle_not_active" };
  }
  return { ok: true as const, group: g };
}

export async function checkSocialAidLimits(args: {
  groupId: string;
  requesterUserId: string;
  amountUsdt: number;
}): Promise<{ ok: true; limitsSnapshot: Record<string, unknown> } | { ok: false; message: string }> {
  if (!Number.isFinite(args.amountUsdt) || args.amountUsdt <= 0) {
    return { ok: false, message: "group_invalid_amount" };
  }

  const gCheck = await assertGroupActive(args.groupId);
  if (!gCheck.ok) return gCheck;

  const funds = await getGroupFundSummary(args.groupId);
  if (funds.socialUsdt + 1e-18 < args.amountUsdt) {
    return { ok: false, message: "group_social_fund_insufficient" };
  }

  const db = getDb();
  const [m] = await db
    .select({ status: groupSavingsMemberships.status })
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, args.groupId),
        eq(groupSavingsMemberships.userId, args.requesterUserId),
      ),
    )
    .limit(1);
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }

  const openLoan = await db
    .select({ id: groupAvecLoans.id })
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.groupId, args.groupId),
        eq(groupAvecLoans.borrowerUserId, args.requesterUserId),
        eq(groupAvecLoans.status, "disbursed"),
        sql`${groupAvecLoans.outstandingUsdt}::numeric > 0`,
      ),
    )
    .limit(1);
  if (openLoan.length > 0) {
    return { ok: false, message: "group_social_aid_loan_outstanding" };
  }

  const minDays = DEFAULT_GOVERNANCE_RULES.socialAidMinDaysBetweenRequests;
  const since = new Date(Date.now() - minDays * 86400000);
  const recent = await db
    .select({ id: groupSocialFundRequests.id })
    .from(groupSocialFundRequests)
    .where(
      and(
        eq(groupSocialFundRequests.groupId, args.groupId),
        eq(groupSocialFundRequests.requesterUserId, args.requesterUserId),
        gte(groupSocialFundRequests.createdAt, since),
        inArray(groupSocialFundRequests.status, ["pending_vote", "paid"]),
      ),
    )
    .limit(1);
  if (recent.length > 0) {
    return { ok: false, message: "group_social_aid_cooldown" };
  }

  const memberPaid = await db
    .select({ s: sql<string>`coalesce(sum(${groupSocialFundRequests.amountUsdt}), 0)` })
    .from(groupSocialFundRequests)
    .where(
      and(
        eq(groupSocialFundRequests.groupId, args.groupId),
        eq(groupSocialFundRequests.requesterUserId, args.requesterUserId),
        eq(groupSocialFundRequests.status, "paid"),
      ),
    );
  const memberTotal = numFromNumeric(memberPaid[0]?.s?.toString() ?? "0");
  if (memberTotal + args.amountUsdt > DEFAULT_GOVERNANCE_RULES.socialAidMaxPerMemberUsdt + 1e-18) {
    return { ok: false, message: "group_social_aid_member_cap" };
  }

  const groupPaid = await db
    .select({ s: sql<string>`coalesce(sum(${groupSocialFundRequests.amountUsdt}), 0)` })
    .from(groupSocialFundRequests)
    .where(
      and(
        eq(groupSocialFundRequests.groupId, args.groupId),
        eq(groupSocialFundRequests.status, "paid"),
        gte(groupSocialFundRequests.paidAt, since),
      ),
    );
  const groupMonthTotal = numFromNumeric(groupPaid[0]?.s?.toString() ?? "0");
  if (
    groupMonthTotal + args.amountUsdt >
    DEFAULT_GOVERNANCE_RULES.socialAidMaxPerMonthGroupUsdt + 1e-18
  ) {
    return { ok: false, message: "group_social_aid_group_cap" };
  }

  const pendingVote = await db
    .select({ id: groupSocialFundRequests.id })
    .from(groupSocialFundRequests)
    .where(
      and(
        eq(groupSocialFundRequests.groupId, args.groupId),
        eq(groupSocialFundRequests.status, "pending_vote"),
      ),
    )
    .limit(1);
  if (pendingVote.length > 0) {
    return { ok: false, message: "group_social_aid_pending_exists" };
  }

  return {
    ok: true,
    limitsSnapshot: {
      socialBalanceUsdt: funds.socialUsdt,
      memberCapUsdt: DEFAULT_GOVERNANCE_RULES.socialAidMaxPerMemberUsdt,
      groupMonthCapUsdt: DEFAULT_GOVERNANCE_RULES.socialAidMaxPerMonthGroupUsdt,
      minDaysBetween: minDays,
    },
  };
}

export async function requestSocialAid(args: {
  groupId: string;
  requesterUserId: string;
  aidType: SocialAidType;
  aidMode: SocialAidMode;
  amountUsdt: number;
  justification: string;
  proofAttachmentUrl?: string | null;
}): Promise<
  | { ok: true; requestId: string; proposalId: string; voteClosesAt: string }
  | { ok: false; message: string }
> {
  if (!SOCIAL_AID_TYPES.includes(args.aidType)) {
    return { ok: false, message: "group_social_aid_invalid_type" };
  }
  if (!SOCIAL_AID_MODES.includes(args.aidMode)) {
    return { ok: false, message: "group_social_aid_invalid_mode" };
  }

  const justification = args.justification.trim();
  if (justification.length < 10) {
    return { ok: false, message: "group_gov_justification_required" };
  }

  const limits = await checkSocialAidLimits({
    groupId: args.groupId,
    requesterUserId: args.requesterUserId,
    amountUsdt: args.amountUsdt,
  });
  if (!limits.ok) return limits;

  const proposalType = socialAidProposalType(args.amountUsdt);
  const requesterDisplay = await userDisplayName(args.requesterUserId);
  const title = `Social aid ${args.amountUsdt.toFixed(2)} USDT · ${args.aidType}`;
  const voteJustification = `${justification} (${args.aidMode})`;

  const gov = await insertAndStartProposal({
    groupId: args.groupId,
    authorUserId: args.requesterUserId,
    type: proposalType,
    title,
    justification: voteJustification,
    financialImpactUsdt: fmtWalletAmount(args.amountUsdt),
    beneficiaryUserId: args.requesterUserId,
    payload: {
      requesterUserId: args.requesterUserId,
      aidType: args.aidType,
      aidMode: args.aidMode,
      amountUsdt: args.amountUsdt,
    },
  });
  if (!gov.ok) return gov;

  const db = getDb();
  const [row] = await db
    .insert(groupSocialFundRequests)
    .values({
      groupId: args.groupId,
      requesterUserId: args.requesterUserId,
      aidType: args.aidType,
      aidMode: args.aidMode,
      amountUsdt: fmtWalletAmount(args.amountUsdt),
      justification,
      proofAttachmentUrl: args.proofAttachmentUrl?.trim() || null,
      status: "pending_vote",
      proposalId: gov.proposalId,
      limitsSnapshot: limits.limitsSnapshot,
    })
    .returning({ id: groupSocialFundRequests.id });

  if (!row?.id) return { ok: false, message: "group_action_failed" };

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.requesterUserId,
    action: "social_aid_requested",
    after: {
      requestId: row.id,
      proposalId: gov.proposalId,
      amountUsdt: args.amountUsdt,
      aidType: args.aidType,
    },
  });

  try {
    const { getDb: gdb, groupMessages } = await import("@/db");
    const messagingDb = gdb();
    await messagingDb.insert(groupMessages).values({
      groupId: args.groupId,
      senderUserId: args.requesterUserId,
      body: `SOCIAL_AID_REQUEST|${row.id}|${args.amountUsdt.toFixed(2)}|${args.aidType}`,
      messageType: "social_aid_requested",
      meta: {
        requestId: row.id,
        proposalId: gov.proposalId,
        requesterUserId: args.requesterUserId,
        requesterDisplay,
        amountUsdt: args.amountUsdt,
        aidType: args.aidType,
        aidMode: args.aidMode,
      },
    });
    await notifyGroupMembers({
      groupId: args.groupId,
      kind: "group_message",
      excludeUserId: args.requesterUserId,
      payload: {
        groupId: args.groupId,
        preview: `Social aid vote: ${args.amountUsdt.toFixed(2)} USDT`,
      },
    });
  } catch {
    // optional dialogue message
  }

  return {
    ok: true,
    requestId: row.id,
    proposalId: gov.proposalId,
    voteClosesAt: gov.voteClosesAt,
  };
}

export async function syncSocialAidRequestAfterVote(args: {
  proposalId: string;
  groupId: string;
  result: "passed" | "rejected" | "expired";
}): Promise<void> {
  const db = getDb();
  const status =
    args.result === "passed" ? "approved" : args.result === "rejected" ? "rejected" : "expired";
  await db
    .update(groupSocialFundRequests)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(groupSocialFundRequests.proposalId, args.proposalId),
        eq(groupSocialFundRequests.groupId, args.groupId),
        eq(groupSocialFundRequests.status, "pending_vote"),
      ),
    );
}

export async function executeSocialAidFromGovernance(args: {
  groupId: string;
  proposalId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getDb();
  const [req] = await db
    .select()
    .from(groupSocialFundRequests)
    .where(
      and(
        eq(groupSocialFundRequests.proposalId, args.proposalId),
        eq(groupSocialFundRequests.groupId, args.groupId),
      ),
    )
    .limit(1);
  if (!req) return { ok: false, message: "group_social_aid_not_found" };

  const amountUsdt = Number(req.amountUsdt);
  const funds = await getGroupFundSummary(args.groupId);
  if (funds.socialUsdt + 1e-18 < amountUsdt) {
    return { ok: false, message: "group_social_fund_insufficient" };
  }

  const batchId = randomUUID();
  const amtStr = fmtWalletAmount(amountUsdt);

  return db.transaction(async (tx) => {
    await tx.insert(groupWalletLedgerEntries).values({
      batchId,
      groupId: args.groupId,
      entryType: "group_social_aid_out",
      asset: "USDT",
      amount: `-${amtStr}`,
      meta: {
        requestId: req.id,
        proposalId: args.proposalId,
        requesterUserId: req.requesterUserId,
        aidType: req.aidType,
        ...fundBucketMeta("social"),
      },
    });

    await creditUserAsset(tx, req.requesterUserId, "USDT", amtStr);
    await insertWalletLedgerLines(tx, [
      {
        batchId,
        userId: req.requesterUserId,
        entryType: "group_social_aid_in",
        asset: "USDT",
        amount: amtStr,
        meta: {
          groupId: args.groupId,
          requestId: req.id,
          proposalId: args.proposalId,
          aidType: req.aidType,
        },
      },
    ]);

    const now = new Date();
    await tx
      .update(groupSocialFundRequests)
      .set({ status: "paid", paidAt: now, updatedAt: now })
      .where(eq(groupSocialFundRequests.id, req.id));

    await writeGroupAudit({
      groupId: args.groupId,
      actorUserId: args.actorUserId,
      action: "social_aid_paid",
      after: {
        requestId: req.id,
        proposalId: args.proposalId,
        amountUsdt,
        requesterUserId: req.requesterUserId,
      },
    });

    const display = await userDisplayName(req.requesterUserId);
    try {
      const { groupMessages } = await import("@/db");
      await tx.insert(groupMessages).values({
        groupId: args.groupId,
        senderUserId: args.actorUserId,
        body: `SOCIAL_AID_PAID|${req.id}|${amountUsdt.toFixed(2)}`,
        messageType: "social_aid_paid",
        meta: {
          requestId: req.id,
          amountUsdt,
          requesterDisplay: display,
          aidType: req.aidType,
        },
      });
    } catch {
      // optional
    }

    await createUserNotification({
      userId: req.requesterUserId,
      kind: "group_payout",
      payload: {
        groupId: args.groupId,
        amount: amountUsdt.toFixed(2),
        asset: "USDT",
        socialAid: true,
      },
    });

    return { ok: true };
  });
}

export async function listSocialAidRequests(args: {
  groupId: string;
  userId: string;
}): Promise<
  | {
      ok: true;
      socialBalanceUsdt: number;
      limits: Record<string, unknown>;
      requests: Array<{
        id: string;
        requesterUserId: string;
        requesterDisplay: string;
        aidType: string;
        aidMode: string;
        amountUsdt: number;
        status: string;
        proposalId: string | null;
        justification: string;
        createdAt: string;
        paidAt: string | null;
      }>;
    }
  | { ok: false; message: string }
> {
  const m = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.userId,
  });
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }

  const funds = await getGroupFundSummary(args.groupId);
  const db = getDb();
  const rows = await db
    .select()
    .from(groupSocialFundRequests)
    .where(eq(groupSocialFundRequests.groupId, args.groupId))
    .orderBy(desc(groupSocialFundRequests.createdAt))
    .limit(30);

  const requests = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      requesterUserId: r.requesterUserId,
      requesterDisplay: await userDisplayName(r.requesterUserId),
      aidType: r.aidType,
      aidMode: r.aidMode,
      amountUsdt: numFromNumeric(r.amountUsdt?.toString()),
      status: r.status,
      proposalId: r.proposalId,
      justification: r.justification,
      createdAt: r.createdAt.toISOString(),
      paidAt: r.paidAt?.toISOString() ?? null,
    })),
  );

  return {
    ok: true,
    socialBalanceUsdt: funds.socialUsdt,
    limits: {
      committeeMaxUsdt: DEFAULT_GOVERNANCE_RULES.socialAidCommitteeMaxUsdt,
      memberCapUsdt: DEFAULT_GOVERNANCE_RULES.socialAidMaxPerMemberUsdt,
      groupMonthCapUsdt: DEFAULT_GOVERNANCE_RULES.socialAidMaxPerMonthGroupUsdt,
      minDaysBetween: DEFAULT_GOVERNANCE_RULES.socialAidMinDaysBetweenRequests,
    },
    requests,
  };
}
