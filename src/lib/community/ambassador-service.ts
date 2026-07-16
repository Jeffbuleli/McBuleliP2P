import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { ambassadorApplications, getDb, users } from "@/db";
import { getActiveBuildersMembership } from "@/lib/builders/builders-service";
import { isAmbassadorCharterEligible } from "@/lib/builders/builders-soft-perks";
import {
  AMBASSADOR_CHARTER_BULLET_KEYS,
  AMBASSADOR_CHARTER_VERSION,
  AMBASSADOR_STATUS,
  isAmbassadorApplicationsEnabled,
  type AmbassadorStatus,
} from "@/lib/community/ambassador-config";
import { ensureAmbassadorSchema } from "@/lib/community/ambassador-schema";

export type AmbassadorApplicationRow = {
  id: string;
  userId: string;
  status: AmbassadorStatus;
  region: string;
  motivation: string;
  experience: string | null;
  languages: string | null;
  charterVersion: string;
  charterAcceptedAt: string;
  builderTierAtApply: string;
  rejectReason: string | null;
  startsAt: string | null;
  endsAt: string | null;
  processedAt: string | null;
  createdAt: string;
};

function mapRow(
  r: typeof ambassadorApplications.$inferSelect,
): AmbassadorApplicationRow {
  return {
    id: r.id,
    userId: r.userId,
    status: r.status as AmbassadorStatus,
    region: r.region,
    motivation: r.motivation,
    experience: r.experience,
    languages: r.languages,
    charterVersion: r.charterVersion,
    charterAcceptedAt: r.charterAcceptedAt.toISOString(),
    builderTierAtApply: r.builderTierAtApply,
    rejectReason: r.rejectReason,
    startsAt: r.startsAt?.toISOString() ?? null,
    endsAt: r.endsAt?.toISOString() ?? null,
    processedAt: r.processedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function getActiveAmbassadorMandate(
  userId: string,
): Promise<AmbassadorApplicationRow | null> {
  await ensureAmbassadorSchema();
  const db = getDb();
  const [row] = await db
    .select()
    .from(ambassadorApplications)
    .where(
      and(
        eq(ambassadorApplications.userId, userId),
        eq(ambassadorApplications.status, AMBASSADOR_STATUS.ACTIVE),
      ),
    )
    .orderBy(desc(ambassadorApplications.startsAt))
    .limit(1);
  return row ? mapRow(row) : null;
}

export async function getPendingAmbassadorApplication(
  userId: string,
): Promise<AmbassadorApplicationRow | null> {
  await ensureAmbassadorSchema();
  const db = getDb();
  const [row] = await db
    .select()
    .from(ambassadorApplications)
    .where(
      and(
        eq(ambassadorApplications.userId, userId),
        eq(ambassadorApplications.status, AMBASSADOR_STATUS.PENDING),
      ),
    )
    .orderBy(desc(ambassadorApplications.createdAt))
    .limit(1);
  return row ? mapRow(row) : null;
}

/** Batch: userIds that currently hold an active Ambassadeur mandate. */
export async function getActiveAmbassadorUserIds(
  userIds: string[],
): Promise<Set<string>> {
  await ensureAmbassadorSchema();
  const uniq = [...new Set(userIds)];
  const out = new Set<string>();
  if (!uniq.length) return out;

  const db = getDb();
  const rows = await db
    .select({ userId: ambassadorApplications.userId })
    .from(ambassadorApplications)
    .where(
      and(
        inArray(ambassadorApplications.userId, uniq),
        eq(ambassadorApplications.status, AMBASSADOR_STATUS.ACTIVE),
      ),
    );
  for (const r of rows) out.add(r.userId);
  return out;
}

export async function getAmbassadorEligibility(userId: string): Promise<{
  applicationsEnabled: boolean;
  kycApproved: boolean;
  builderTier: string | null;
  goldPlus: boolean;
  canApply: boolean;
  blockReason: string | null;
}> {
  await ensureAmbassadorSchema();
  const applicationsEnabled = isAmbassadorApplicationsEnabled();
  const db = getDb();
  const [user] = await db
    .select({ kycStatus: users.kycStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const kycApproved = user?.kycStatus === "approved";

  let builderTier: string | null = null;
  try {
    const membership = await getActiveBuildersMembership(userId);
    builderTier = membership?.tier ?? null;
  } catch {
    builderTier = null;
  }
  const goldPlus = isAmbassadorCharterEligible(builderTier);

  const [pending, active] = await Promise.all([
    getPendingAmbassadorApplication(userId),
    getActiveAmbassadorMandate(userId),
  ]);

  let blockReason: string | null = null;
  if (!applicationsEnabled) blockReason = "amb_disabled";
  else if (!kycApproved) blockReason = "amb_kyc_required";
  else if (!goldPlus) blockReason = "amb_gold_required";
  else if (pending) blockReason = "amb_pending_exists";
  else if (active) blockReason = "amb_already_active";

  return {
    applicationsEnabled,
    kycApproved,
    builderTier,
    goldPlus,
    canApply: blockReason == null,
    blockReason,
  };
}

export async function getAmbassadorSummary(userId: string) {
  const [eligibility, pending, active] = await Promise.all([
    getAmbassadorEligibility(userId),
    getPendingAmbassadorApplication(userId),
    getActiveAmbassadorMandate(userId),
  ]);

  const db = getDb();
  const history = await db
    .select()
    .from(ambassadorApplications)
    .where(eq(ambassadorApplications.userId, userId))
    .orderBy(desc(ambassadorApplications.createdAt))
    .limit(10);

  return {
    charterVersion: AMBASSADOR_CHARTER_VERSION,
    charterBullets: [...AMBASSADOR_CHARTER_BULLET_KEYS],
    eligibility,
    pending,
    active,
    history: history.map(mapRow),
  };
}

export async function submitAmbassadorApplication(args: {
  userId: string;
  region: string;
  motivation: string;
  experience?: string;
  languages?: string;
  charterAccepted: boolean;
}): Promise<
  | { ok: true; application: AmbassadorApplicationRow }
  | { ok: false; code: string }
> {
  await ensureAmbassadorSchema();

  const region = args.region.trim().slice(0, 120);
  const motivation = args.motivation.trim();
  const experience = args.experience?.trim().slice(0, 4000) || null;
  const languages = args.languages?.trim().slice(0, 120) || null;

  if (!args.charterAccepted) return { ok: false, code: "amb_charter_required" };
  if (region.length < 2) return { ok: false, code: "amb_invalid_region" };
  if (motivation.length < 40) return { ok: false, code: "amb_motivation_short" };
  if (motivation.length > 4000) return { ok: false, code: "amb_motivation_long" };

  const eligibility = await getAmbassadorEligibility(args.userId);
  if (!eligibility.canApply) {
    return { ok: false, code: eligibility.blockReason ?? "amb_not_eligible" };
  }
  if (!eligibility.builderTier) {
    return { ok: false, code: "amb_gold_required" };
  }

  const db = getDb();
  const now = new Date();
  const [inserted] = await db
    .insert(ambassadorApplications)
    .values({
      userId: args.userId,
      status: AMBASSADOR_STATUS.PENDING,
      region,
      motivation,
      experience,
      languages,
      charterVersion: AMBASSADOR_CHARTER_VERSION,
      charterAcceptedAt: now,
      builderTierAtApply: eligibility.builderTier,
    })
    .returning();

  if (!inserted) return { ok: false, code: "amb_submit_failed" };
  return { ok: true, application: mapRow(inserted) };
}

export async function listAdminAmbassadorApplications(args?: {
  status?: AmbassadorStatus;
  limit?: number;
}) {
  await ensureAmbassadorSchema();
  const db = getDb();
  const limit = args?.limit ?? 50;
  const conditions = args?.status
    ? eq(ambassadorApplications.status, args.status)
    : undefined;

  const rows = await db
    .select({
      id: ambassadorApplications.id,
      userId: ambassadorApplications.userId,
      userEmail: users.email,
      status: ambassadorApplications.status,
      region: ambassadorApplications.region,
      motivation: ambassadorApplications.motivation,
      experience: ambassadorApplications.experience,
      languages: ambassadorApplications.languages,
      charterVersion: ambassadorApplications.charterVersion,
      builderTierAtApply: ambassadorApplications.builderTierAtApply,
      rejectReason: ambassadorApplications.rejectReason,
      startsAt: ambassadorApplications.startsAt,
      endsAt: ambassadorApplications.endsAt,
      createdAt: ambassadorApplications.createdAt,
    })
    .from(ambassadorApplications)
    .innerJoin(users, eq(ambassadorApplications.userId, users.id))
    .where(conditions)
    .orderBy(desc(ambassadorApplications.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userEmail: r.userEmail,
    status: r.status as AmbassadorStatus,
    region: r.region,
    motivation: r.motivation,
    experience: r.experience,
    languages: r.languages,
    charterVersion: r.charterVersion,
    builderTierAtApply: r.builderTierAtApply,
    rejectReason: r.rejectReason,
    startsAt: r.startsAt?.toISOString() ?? null,
    endsAt: r.endsAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function approveAmbassadorApplication(args: {
  applicationId: string;
  staffUserId: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  await ensureAmbassadorSchema();
  const db = getDb();
  const [row] = await db
    .select()
    .from(ambassadorApplications)
    .where(eq(ambassadorApplications.id, args.applicationId))
    .limit(1);

  if (!row) return { ok: false, code: "amb_not_found" };
  if (row.status !== AMBASSADOR_STATUS.PENDING) {
    return { ok: false, code: "amb_not_pending" };
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(ambassadorApplications)
      .set({
        status: AMBASSADOR_STATUS.REVOKED,
        endsAt: now,
        processedAt: now,
        processedByUserId: args.staffUserId,
      })
      .where(
        and(
          eq(ambassadorApplications.userId, row.userId),
          eq(ambassadorApplications.status, AMBASSADOR_STATUS.ACTIVE),
        ),
      );

    await tx
      .update(ambassadorApplications)
      .set({
        status: AMBASSADOR_STATUS.ACTIVE,
        startsAt: now,
        endsAt: null,
        processedAt: now,
        processedByUserId: args.staffUserId,
        rejectReason: null,
      })
      .where(eq(ambassadorApplications.id, args.applicationId));
  });

  return { ok: true };
}

export async function rejectAmbassadorApplication(args: {
  applicationId: string;
  staffUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  await ensureAmbassadorSchema();
  const reason = args.reason.trim().slice(0, 1000);
  if (!reason) return { ok: false, code: "amb_reason_required" };

  const db = getDb();
  const [row] = await db
    .select()
    .from(ambassadorApplications)
    .where(eq(ambassadorApplications.id, args.applicationId))
    .limit(1);

  if (!row) return { ok: false, code: "amb_not_found" };
  if (row.status !== AMBASSADOR_STATUS.PENDING) {
    return { ok: false, code: "amb_not_pending" };
  }

  const now = new Date();
  await db
    .update(ambassadorApplications)
    .set({
      status: AMBASSADOR_STATUS.REJECTED,
      rejectReason: reason,
      processedAt: now,
      processedByUserId: args.staffUserId,
    })
    .where(eq(ambassadorApplications.id, args.applicationId));

  return { ok: true };
}

export async function revokeAmbassadorMandate(args: {
  applicationId: string;
  staffUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  await ensureAmbassadorSchema();
  const reason = args.reason.trim().slice(0, 1000);
  if (!reason) return { ok: false, code: "amb_reason_required" };

  const db = getDb();
  const [row] = await db
    .select()
    .from(ambassadorApplications)
    .where(eq(ambassadorApplications.id, args.applicationId))
    .limit(1);

  if (!row) return { ok: false, code: "amb_not_found" };
  if (row.status !== AMBASSADOR_STATUS.ACTIVE) {
    return { ok: false, code: "amb_not_active" };
  }

  const now = new Date();
  await db
    .update(ambassadorApplications)
    .set({
      status: AMBASSADOR_STATUS.REVOKED,
      endsAt: now,
      rejectReason: reason,
      processedAt: now,
      processedByUserId: args.staffUserId,
    })
    .where(eq(ambassadorApplications.id, args.applicationId));

  return { ok: true };
}
