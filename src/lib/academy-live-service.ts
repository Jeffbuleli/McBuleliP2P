import { and, desc, eq, gt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  academyEditions,
  academyEditionHosts,
  academyEnrollments,
  academyLivePurchases,
  academyPrograms,
  academySessions,
  getDb,
  users,
} from "@/db";
import { ACADEMY_PROGRAM_LIVE_STUDIO } from "@/lib/academy-config";
import {
  ACADEMY_LIVE_PLANS,
  type AcademyLivePlanId,
  getAcademyLivePlan,
  isAcademyLivePlanId,
} from "@/lib/academy-live-plans";
import { isEditionCoHost } from "@/lib/academy-edition-hosts";
import { fmtWalletAmount } from "@/lib/wallet-types";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { isSuperAdminUserId } from "@/lib/bot-super-admin";
import { UserRole, type UserRoleType } from "@/lib/roles";

function isStaffLiveRole(role: UserRoleType | null | undefined): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.AGENT;
}

export type AcademyLivePurchaseRow = {
  id: string;
  planId: AcademyLivePlanId;
  pricePaid: string;
  sessionsRemaining: number;
  maxParticipants: number;
  maxMinutesPerSession: number;
  expiresAt: string | null;
};

const PURCHASE_VALID_DAYS = 31;

export async function ensureAcademyLiveStudioProgram(): Promise<string> {
  const db = getDb();
  const [existing] = await db
    .select({ id: academyPrograms.id })
    .from(academyPrograms)
    .where(eq(academyPrograms.slug, ACADEMY_PROGRAM_LIVE_STUDIO))
    .limit(1);
  if (existing) return existing.id;

  const [row] = await db
    .insert(academyPrograms)
    .values({
      slug: ACADEMY_PROGRAM_LIVE_STUDIO,
      level: "foundation",
      priceUsdt: null,
      titleFr: "Live Studio McBuleli",
      titleEn: "McBuleli Live Studio",
      summaryFr: "Salles live pour votre communauté — hébergement payant, participation gratuite.",
      summaryEn: "Live rooms for your community — paid hosting, free to join.",
      topics: ["live"],
      requiresKyc: false,
      sortOrder: 90,
      published: true,
    })
    .returning({ id: academyPrograms.id });
  return row.id;
}

export async function getActiveLivePurchase(
  userId: string,
): Promise<AcademyLivePurchaseRow | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .select()
    .from(academyLivePurchases)
    .where(
      and(
        eq(academyLivePurchases.userId, userId),
        eq(academyLivePurchases.status, "active"),
        gt(academyLivePurchases.sessionsRemaining, 0),
        sql`(${academyLivePurchases.expiresAt} IS NULL OR ${academyLivePurchases.expiresAt} > ${now})`,
      ),
    )
    .orderBy(desc(academyLivePurchases.expiresAt))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    planId: row.planId as AcademyLivePlanId,
    pricePaid: row.pricePaid.toString(),
    sessionsRemaining: row.sessionsRemaining,
    maxParticipants: row.maxParticipants,
    maxMinutesPerSession: row.maxMinutesPerSession,
    expiresAt: row.expiresAt?.toISOString() ?? null,
  };
}

export async function purchaseAcademyLivePlan(args: {
  userId: string;
  planId: AcademyLivePlanId;
}): Promise<
  | { ok: true; purchase: AcademyLivePurchaseRow }
  | { ok: false; message: string }
> {
  if (!isAcademyLivePlanId(args.planId)) {
    return { ok: false, message: "academy_live_invalid_plan" };
  }
  const plan = getAcademyLivePlan(args.planId);
  const privileged = await isSuperAdminUserId(args.userId);
  const priceStr = privileged ? "0" : fmtWalletAmount(plan.priceUsdt);
  const existing = await getActiveLivePurchase(args.userId);
  if (existing && !privileged) {
    return { ok: false, message: "academy_live_purchase_active" };
  }
  if (existing && privileged) {
    return { ok: true, purchase: existing };
  }

  const expiresAt = new Date(
    Date.now() + PURCHASE_VALID_DAYS * 24 * 60 * 60 * 1000,
  );
  const db = getDb();

  try {
    const purchase = await db.transaction(async (tx) => {
      if (!privileged) {
        const [deducted] = await tx
          .update(users)
          .set({
            balance: sql`${users.balance} - ${priceStr}::numeric`,
          })
          .where(
            and(
              eq(users.id, args.userId),
              sql`${users.balance} >= ${priceStr}::numeric`,
            ),
          )
          .returning({ id: users.id });
        if (!deducted) throw new Error("academy_live_insufficient_balance");

        await insertWalletLedgerLines(tx, [
          {
            batchId: randomUUID(),
            userId: args.userId,
            entryType: "academy_live_studio",
            asset: "USDT",
            amount: `-${priceStr}`,
            meta: { planId: args.planId },
          },
        ]);
      }

      const [row] = await tx
        .insert(academyLivePurchases)
        .values({
          userId: args.userId,
          planId: args.planId,
          pricePaid: priceStr,
          status: "active",
          sessionsRemaining: plan.sessionsPerPeriod,
          maxParticipants: plan.maxParticipants,
          maxMinutesPerSession: plan.maxMinutesPerSession,
          expiresAt,
        })
        .returning();

      return {
        id: row.id,
        planId: row.planId as AcademyLivePlanId,
        pricePaid: row.pricePaid.toString(),
        sessionsRemaining: row.sessionsRemaining,
        maxParticipants: row.maxParticipants,
        maxMinutesPerSession: row.maxMinutesPerSession,
        expiresAt: row.expiresAt?.toISOString() ?? null,
      };
    });
    return { ok: true, purchase };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "academy_live_purchase_failed";
    return { ok: false, message: msg };
  }
}

export async function isLiveStudioEditionOwner(args: {
  userId: string;
  editionId: string;
}): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({
      ownerUserId: academyEditions.ownerUserId,
      source: academyEditions.source,
    })
    .from(academyEditions)
    .where(eq(academyEditions.id, args.editionId))
    .limit(1);
  return (
    row?.source === "live_studio" &&
    row.ownerUserId != null &&
    row.ownerUserId === args.userId
  );
}

/** Peut animer (modérateur Jitsi) : staff, co-host, ou propriétaire Live Studio avec crédit actif. */
export async function canUserHostAcademyLive(args: {
  userId: string;
  editionId: string;
  appRole: UserRoleType | null | undefined;
}): Promise<boolean> {
  if (isStaffLiveRole(args.appRole)) return true;
  if (await isEditionCoHost({ userId: args.userId, editionId: args.editionId })) {
    return true;
  }
  if (!(await isLiveStudioEditionOwner(args))) return false;
  const purchase = await getActiveLivePurchase(args.userId);
  return purchase != null && purchase.sessionsRemaining > 0;
}

/** Peut rejoindre : inscrit à l'édition ou staff/co-host. */
export async function canUserJoinAcademyLive(args: {
  userId: string;
  editionId: string;
  appRole: UserRoleType | null | undefined;
}): Promise<boolean> {
  if (isStaffLiveRole(args.appRole)) return true;
  if (await isEditionCoHost({ userId: args.userId, editionId: args.editionId })) {
    return true;
  }
  const db = getDb();
  const [en] = await db
    .select({ id: academyEnrollments.id })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.userId, args.userId),
        eq(academyEnrollments.editionId, args.editionId),
      ),
    )
    .limit(1);
  return !!en;
}

function slugifyLiveEdition(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "live"}-${randomUUID().slice(0, 8)}`;
}

export async function createLiveStudioEdition(args: {
  userId: string;
  titleFr: string;
  startsAt: Date;
  durationMin?: number;
}): Promise<
  | {
      ok: true;
      editionSlug: string;
      sessionSlug: string;
      programSlug: string;
    }
  | { ok: false; message: string }
> {
  const purchase = await getActiveLivePurchase(args.userId);
  if (!purchase || purchase.sessionsRemaining < 1) {
    return { ok: false, message: "academy_live_no_credits" };
  }

  const plan = ACADEMY_LIVE_PLANS[purchase.planId];
  const durationMin = Math.min(
    args.durationMin ?? plan.maxMinutesPerSession,
    plan.maxMinutesPerSession,
  );
  const programId = await ensureAcademyLiveStudioProgram();
  const editionSlug = slugifyLiveEdition(args.titleFr);
  const sessionSlug = "session-1";
  const liveBase =
    process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.trim() ||
    process.env.ACADEMY_LIVE_BASE_URL?.trim() ||
    null;
  const endsAt = new Date(args.startsAt.getTime() + durationMin * 60 * 1000);

  const db = getDb();
  try {
    await db.transaction(async (tx) => {
      const [dec] = await tx
        .update(academyLivePurchases)
        .set({
          sessionsRemaining: sql`${academyLivePurchases.sessionsRemaining} - 1`,
        })
        .where(
          and(
            eq(academyLivePurchases.id, purchase.id),
            sql`${academyLivePurchases.sessionsRemaining} > 0`,
          ),
        )
        .returning({ id: academyLivePurchases.id });
      if (!dec) throw new Error("academy_live_no_credits");

      const [edition] = await tx
        .insert(academyEditions)
        .values({
          programId,
          slug: editionSlug,
          titleFr: args.titleFr.slice(0, 160),
          titleEn: args.titleFr.slice(0, 160),
          deliveryMode: "online",
          status: "open",
          startsAt: args.startsAt,
          endsAt,
          source: "live_studio",
          ownerUserId: args.userId,
          liveBaseUrl: liveBase,
          tutorEnabled: false,
          cohortMeta: {
            liveStudio: true,
            maxParticipants: purchase.maxParticipants,
            purchaseId: purchase.id,
          },
        })
        .returning({ id: academyEditions.id });

      await tx.insert(academyEditionHosts).values({
        editionId: edition.id,
        userId: args.userId,
        role: "host",
      });

      await tx.insert(academySessions).values({
        editionId: edition.id,
        slug: sessionSlug,
        titleFr: args.titleFr.slice(0, 160),
        titleEn: args.titleFr.slice(0, 160),
        kind: "live",
        startsAt: args.startsAt,
        endsAt,
        sortOrder: 0,
      });

      await tx.insert(academyEnrollments).values({
        userId: args.userId,
        editionId: edition.id,
        status: "active",
        paidUsdt: "0",
      });
    });

    return {
      ok: true,
      editionSlug,
      sessionSlug,
      programSlug: ACADEMY_PROGRAM_LIVE_STUDIO,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "academy_live_create_failed";
    return { ok: false, message: msg };
  }
}

export function listLiveStudioPlansForUi() {
  return Object.values(ACADEMY_LIVE_PLANS).map((p) => ({
    id: p.id,
    labelFr: p.labelFr,
    priceUsdt: p.priceUsdt,
    maxParticipants: p.maxParticipants,
    maxMinutes: p.maxMinutesPerSession,
    sessions: p.sessionsPerPeriod,
  }));
}
