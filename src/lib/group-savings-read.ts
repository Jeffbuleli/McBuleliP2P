import { eq } from "drizzle-orm";
import { getDb, groupSavingsGroups } from "@/db";
import {
  AVEC_DEFAULT_MEETING_DAYS,
  AVEC_MAX_SHARES_PER_MEETING,
} from "@/lib/group-savings-types";

function isPgMissingColumn(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /column .* does not exist|42703/.test(msg);
}

/** Row shape used by dashboard + admin (extended fields defaulted when DB not migrated). */
export type GroupSavingsRow = {
  id: string;
  type: string;
  name: string;
  countryCode: string | null;
  minMembers: number;
  maxMembers: number;
  contributionAmountUsdt: string | null;
  cycleDurationDays: number;
  maxSharesPerMeeting: number;
  meetingIntervalDays: number;
  socialFundUsdt: string | null;
  paymentRules: string | null;
  logoUrl: string | null;
  address: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  publicDescription: string | null;
  status: string;
  subscriptionStatus: string;
  nextBillingAt: Date | null;
  createdByUserId: string;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeBase(row: {
  id: string;
  type: string;
  name: string;
  countryCode: string | null;
  minMembers: number;
  maxMembers: number;
  contributionAmountUsdt: string | null;
  cycleDurationDays: number;
  paymentRules: string | null;
  status: string;
  subscriptionStatus: string;
  nextBillingAt: Date | null;
  createdByUserId: string;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}): GroupSavingsRow {
  return {
    ...row,
    maxSharesPerMeeting: AVEC_MAX_SHARES_PER_MEETING,
    meetingIntervalDays: AVEC_DEFAULT_MEETING_DAYS,
    socialFundUsdt: "0",
    logoUrl: null,
    address: null,
    contactPhone: null,
    contactEmail: null,
    publicDescription: null,
  };
}

/** Safe read — works before/after drizzle 0029/0030 on production DB. */
export async function fetchGroupById(groupId: string): Promise<GroupSavingsRow | null> {
  const db = getDb();
  try {
    const [g] = await db
      .select()
      .from(groupSavingsGroups)
      .where(eq(groupSavingsGroups.id, groupId))
      .limit(1);
    if (!g) return null;
    return {
      id: g.id,
      type: g.type,
      name: g.name,
      countryCode: g.countryCode,
      minMembers: g.minMembers,
      maxMembers: g.maxMembers,
      contributionAmountUsdt: g.contributionAmountUsdt,
      cycleDurationDays: g.cycleDurationDays,
      maxSharesPerMeeting: g.maxSharesPerMeeting ?? AVEC_MAX_SHARES_PER_MEETING,
      meetingIntervalDays: g.meetingIntervalDays ?? AVEC_DEFAULT_MEETING_DAYS,
      socialFundUsdt: g.socialFundUsdt ?? "0",
      paymentRules: g.paymentRules,
      logoUrl: g.logoUrl ?? null,
      address: g.address ?? null,
      contactPhone: g.contactPhone ?? null,
      contactEmail: g.contactEmail ?? null,
      publicDescription: g.publicDescription ?? null,
      status: g.status,
      subscriptionStatus: g.subscriptionStatus,
      nextBillingAt: g.nextBillingAt,
      createdByUserId: g.createdByUserId,
      reviewedByUserId: g.reviewedByUserId,
      reviewedAt: g.reviewedAt,
      rejectionReason: g.rejectionReason,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  } catch (e) {
    if (!isPgMissingColumn(e)) throw e;
    const [g] = await db
      .select({
        id: groupSavingsGroups.id,
        type: groupSavingsGroups.type,
        name: groupSavingsGroups.name,
        countryCode: groupSavingsGroups.countryCode,
        minMembers: groupSavingsGroups.minMembers,
        maxMembers: groupSavingsGroups.maxMembers,
        contributionAmountUsdt: groupSavingsGroups.contributionAmountUsdt,
        cycleDurationDays: groupSavingsGroups.cycleDurationDays,
        paymentRules: groupSavingsGroups.paymentRules,
        status: groupSavingsGroups.status,
        subscriptionStatus: groupSavingsGroups.subscriptionStatus,
        nextBillingAt: groupSavingsGroups.nextBillingAt,
        createdByUserId: groupSavingsGroups.createdByUserId,
        reviewedByUserId: groupSavingsGroups.reviewedByUserId,
        reviewedAt: groupSavingsGroups.reviewedAt,
        rejectionReason: groupSavingsGroups.rejectionReason,
        createdAt: groupSavingsGroups.createdAt,
        updatedAt: groupSavingsGroups.updatedAt,
      })
      .from(groupSavingsGroups)
      .where(eq(groupSavingsGroups.id, groupId))
      .limit(1);
    return g ? normalizeBase(g) : null;
  }
}
