import { and, desc, eq, isNull, sql } from "drizzle-orm";
import {
  getDb,
  groupAvecLoans,
  groupPassportConsents,
  groupSavingsGroups,
  groupSavingsMemberships,
  groupWalletLedgerEntries,
  users,
} from "@/db";
import { getMyMembershipOrNull } from "@/lib/group-savings-permissions";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { numFromNumeric } from "@/lib/wallet-types";
import { computeLoanCharges } from "@/lib/avec/loan-terms";
import {
  computeFinancialReliabilityScore,
  type FinancialReliabilityResult,
} from "@/lib/avec/financial-reliability-score";
import { isKycApproved } from "@/lib/kyc-policy";

const ALLOWED_SCOPES = new Set(["summary", "score", "savings", "loans"]);

export type PassportScope = "summary" | "score" | "savings" | "loans";

export type FinancialPassport = {
  memberUserId: string;
  groupId: string;
  groupName: string;
  displayName: string | null;
  memberSince: string;
  role: string;
  savingsUsdt: number;
  meetingsPaid: number;
  sharesTotal: number;
  contributionConsistencyPct: number;
  loansTotal: number;
  loansRepaid: number;
  loansActive: number;
  latePayments: number;
  reliability: FinancialReliabilityResult;
};

function parseScopes(raw: string): PassportScope[] {
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is PassportScope => ALLOWED_SCOPES.has(s));
}

export async function buildMemberFinancialPassport(args: {
  groupId: string;
  memberUserId: string;
  viewerUserId: string;
}): Promise<
  | { ok: true; passport: FinancialPassport }
  | { ok: false; message: string }
> {
  const viewer = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.viewerUserId,
  });
  if (!viewer || viewer.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }

  const isSelf = args.viewerUserId === args.memberUserId;
  const isManager = ["admin", "co_admin", "committee"].includes(viewer.role);
  if (!isSelf && !isManager) {
    return { ok: false, message: "group_forbidden" };
  }

  const db = getDb();
  const [member] = await db
    .select({
      userId: groupSavingsMemberships.userId,
      role: groupSavingsMemberships.role,
      status: groupSavingsMemberships.status,
      createdAt: groupSavingsMemberships.createdAt,
      email: users.email,
      displayName: users.displayName,
      kycStatus: users.kycStatus,
      groupName: groupSavingsGroups.name,
    })
    .from(groupSavingsMemberships)
    .innerJoin(users, eq(users.id, groupSavingsMemberships.userId))
    .innerJoin(
      groupSavingsGroups,
      eq(groupSavingsGroups.id, groupSavingsMemberships.groupId),
    )
    .where(
      and(
        eq(groupSavingsMemberships.groupId, args.groupId),
        eq(groupSavingsMemberships.userId, args.memberUserId),
        eq(groupSavingsMemberships.status, "approved"),
      ),
    )
    .limit(1);

  if (!member) return { ok: false, message: "group_member_not_found" };

  const contribRows = await db
    .select({
      amount: groupWalletLedgerEntries.amount,
      createdAt: groupWalletLedgerEntries.createdAt,
      meta: groupWalletLedgerEntries.meta,
    })
    .from(groupWalletLedgerEntries)
    .where(
      and(
        eq(groupWalletLedgerEntries.groupId, args.groupId),
        eq(groupWalletLedgerEntries.entryType, "group_contribution_in"),
      ),
    );

  let savingsUsdt = 0;
  let sharesTotal = 0;
  let meetingsPaid = 0;
  const meetingKeys = new Set<string>();
  for (const row of contribRows) {
    const meta = (row.meta ?? {}) as Record<string, unknown>;
    const uid = typeof meta.userId === "string" ? meta.userId : meta.by;
    if (uid !== args.memberUserId) continue;
    savingsUsdt += numFromNumeric(row.amount?.toString());
    const shares = Number(meta.shares ?? meta.shareCount ?? 0);
    if (Number.isFinite(shares) && shares > 0) sharesTotal += shares;
    else sharesTotal += 1;
    const dayKey = row.createdAt.toISOString().slice(0, 10);
    meetingKeys.add(dayKey);
  }
  meetingsPaid = meetingKeys.size;

  const [g] = await db
    .select({
      meetingIntervalDays: groupSavingsGroups.meetingIntervalDays,
      cycleStartedAt: groupSavingsGroups.cycleStartedAt,
      createdAt: groupSavingsGroups.createdAt,
    })
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1);

  const cycleStart = g?.cycleStartedAt ?? g?.createdAt ?? member.createdAt;
  const interval = Math.max(1, g?.meetingIntervalDays ?? 7);
  const expectedMeetings = Math.max(
    1,
    Math.floor((Date.now() - cycleStart.getTime()) / (interval * 86400000)) + 1,
  );
  const contributionConsistencyPct = Math.min(
    100,
    Math.round((meetingsPaid / expectedMeetings) * 100),
  );

  const loans = await db
    .select()
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.groupId, args.groupId),
        eq(groupAvecLoans.borrowerUserId, args.memberUserId),
      ),
    );

  let loansRepaid = 0;
  let loansActive = 0;
  let latePayments = 0;
  for (const loan of loans) {
    if (loan.status === "repaid") loansRepaid += 1;
    if (loan.status === "disbursed") {
      loansActive += 1;
      const charges = computeLoanCharges(loan);
      if (charges.isOverdue) latePayments += 1;
    }
  }

  const membershipAgeDays = Math.max(
    0,
    Math.floor((Date.now() - member.createdAt.getTime()) / 86400000),
  );

  const reliability = computeFinancialReliabilityScore({
    meetingsPaid,
    sharesTotal,
    membershipAgeDays,
    kycApproved: isKycApproved(member.kycStatus),
    loansTotal: loans.length,
    loansRepaid,
    loansActive,
    loansDefaultedOrLate: latePayments,
    contributionConsistencyPct,
  });

  return {
    ok: true,
    passport: {
      memberUserId: args.memberUserId,
      groupId: args.groupId,
      groupName: member.groupName,
      displayName: member.displayName,
      memberSince: member.createdAt.toISOString(),
      role: member.role,
      savingsUsdt: Math.round(savingsUsdt * 100) / 100,
      meetingsPaid,
      sharesTotal,
      contributionConsistencyPct,
      loansTotal: loans.length,
      loansRepaid,
      loansActive,
      latePayments,
      reliability,
    },
  };
}

export async function grantPassportConsent(args: {
  groupId: string;
  memberUserId: string;
  partnerLabel: string;
  scopes: string[];
  durationDays: number;
}): Promise<{ ok: true; consentId: string } | { ok: false; message: string }> {
  const label = args.partnerLabel.trim().slice(0, 128);
  if (!label) return { ok: false, message: "group_invalid_input" };
  const days = Math.min(365, Math.max(1, Math.floor(args.durationDays)));
  const scopes = args.scopes
    .map((s) => s.trim().toLowerCase())
    .filter((s) => ALLOWED_SCOPES.has(s));
  if (scopes.length === 0) return { ok: false, message: "group_invalid_input" };

  const m = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.memberUserId,
  });
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }

  const expiresAt = new Date(Date.now() + days * 86400000);
  const db = getDb();
  const [row] = await db
    .insert(groupPassportConsents)
    .values({
      groupId: args.groupId,
      memberUserId: args.memberUserId,
      partnerLabel: label,
      scopes: scopes.join(","),
      expiresAt,
    })
    .returning({ id: groupPassportConsents.id });

  if (!row?.id) return { ok: false, message: "group_action_failed" };

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.memberUserId,
    action: "passport_consent_granted",
    after: {
      consentId: row.id,
      partnerLabel: label,
      scopes: scopes.join(","),
      expiresAt: expiresAt.toISOString(),
    },
  });

  return { ok: true, consentId: row.id };
}

export async function revokePassportConsent(args: {
  groupId: string;
  memberUserId: string;
  consentId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(groupPassportConsents)
    .where(
      and(
        eq(groupPassportConsents.id, args.consentId),
        eq(groupPassportConsents.groupId, args.groupId),
        eq(groupPassportConsents.memberUserId, args.memberUserId),
      ),
    )
    .limit(1);
  if (!row) return { ok: false, message: "group_not_found" };

  const now = new Date();
  await db
    .update(groupPassportConsents)
    .set({ revokedAt: now, updatedAt: now })
    .where(eq(groupPassportConsents.id, args.consentId));

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.memberUserId,
    action: "passport_consent_revoked",
    after: { consentId: args.consentId },
  });

  return { ok: true };
}

export async function listMyPassportConsents(args: {
  groupId: string;
  memberUserId: string;
}) {
  const db = getDb();
  const rows = await db
    .select()
    .from(groupPassportConsents)
    .where(
      and(
        eq(groupPassportConsents.groupId, args.groupId),
        eq(groupPassportConsents.memberUserId, args.memberUserId),
      ),
    )
    .orderBy(desc(groupPassportConsents.createdAt))
    .limit(50);

  return rows.map((r) => ({
    id: r.id,
    partnerLabel: r.partnerLabel,
    scopes: parseScopes(r.scopes),
    expiresAt: r.expiresAt.toISOString(),
    revokedAt: r.revokedAt?.toISOString() ?? null,
    active:
      !r.revokedAt && r.expiresAt.getTime() > Date.now(),
    createdAt: r.createdAt.toISOString(),
  }));
}

/** Partner access via active consent — logs every access. */
export async function accessPassportWithConsent(args: {
  consentId: string;
  accessorLabel: string;
}): Promise<
  | { ok: true; shared: Record<string, unknown> }
  | { ok: false; message: string }
> {
  const db = getDb();
  const [consent] = await db
    .select()
    .from(groupPassportConsents)
    .where(
      and(
        eq(groupPassportConsents.id, args.consentId),
        isNull(groupPassportConsents.revokedAt),
      ),
    )
    .limit(1);

  if (!consent) return { ok: false, message: "group_forbidden" };
  if (consent.expiresAt.getTime() < Date.now()) {
    return { ok: false, message: "group_passport_expired" };
  }

  const built = await buildMemberFinancialPassport({
    groupId: consent.groupId,
    memberUserId: consent.memberUserId,
    viewerUserId: consent.memberUserId,
  });
  if (!built.ok) return built;

  const scopes = parseScopes(consent.scopes);
  const p = built.passport;
  const shared: Record<string, unknown> = {
    groupId: p.groupId,
    memberUserId: p.memberUserId,
    scopes,
  };
  if (scopes.includes("summary")) {
    shared.memberSince = p.memberSince;
    shared.displayName = p.displayName;
  }
  if (scopes.includes("savings")) {
    shared.savingsUsdt = p.savingsUsdt;
    shared.contributionConsistencyPct = p.contributionConsistencyPct;
  }
  if (scopes.includes("loans")) {
    shared.loansTotal = p.loansTotal;
    shared.loansRepaid = p.loansRepaid;
    shared.loansActive = p.loansActive;
    shared.latePayments = p.latePayments;
  }
  if (scopes.includes("score")) {
    shared.reliabilityScore = p.reliability.score;
    shared.reliabilityFactors = p.reliability.factors.map((f) => ({
      id: f.id,
      points: f.points,
      maxPoints: f.maxPoints,
      rating: f.rating,
    }));
  }

  await writeGroupAudit({
    groupId: consent.groupId,
    actorUserId: null,
    action: "passport_accessed",
    after: {
      consentId: consent.id,
      accessorLabel: args.accessorLabel.slice(0, 128),
      scopes: scopes.join(","),
      memberUserId: consent.memberUserId,
    },
  });

  return { ok: true, shared };
}

/** Unused import guard for sql if needed later — keep stats helper. */
export async function countActivePassportConsents(groupId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(groupPassportConsents)
    .where(
      and(
        eq(groupPassportConsents.groupId, groupId),
        isNull(groupPassportConsents.revokedAt),
        sql`${groupPassportConsents.expiresAt} > now()`,
      ),
    );
  return row?.n ?? 0;
}
