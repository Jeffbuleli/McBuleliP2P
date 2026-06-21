import { and, count, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  academyEnrollments,
  academyTrainingEventParticipants,
  academyTrainingEvents,
  getDb,
  users,
} from "@/db";
import { getAppAbsoluteUrl } from "@/lib/app-url";
import { liveRoomNameFromSessionSlug } from "@/lib/academy-jitsi-token";
import { syncEventCommunityPost, eventToPublic } from "@/lib/events/community-sync";
import {
  canEditEvent,
  canViewEvent,
  resolveEventRole,
} from "@/lib/events/permissions";
import {
  EventAudienceMode,
  EventStatus,
  EventType,
  ParticipantStatus,
  PaymentStatus,
  type CreateEventInput,
  type EventDashboardKpis,
  type EventPublicView,
} from "@/lib/events/types";
import { insertWalletLedgerLines as insertLedger } from "@/lib/wallet-ledger";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";
import type { UserRoleType } from "@/lib/roles";

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
  return base || "formation";
}

async function uniqueSlug(base: string): Promise<string> {
  const db = getDb();
  let slug = base;
  for (let i = 0; i < 20; i++) {
    const [row] = await db
      .select({ id: academyTrainingEvents.id })
      .from(academyTrainingEvents)
      .where(eq(academyTrainingEvents.slug, slug))
      .limit(1);
    if (!row) return slug;
    slug = `${base}-${i + 2}`;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

function deriveEventType(price: number): "FREE" | "PAID" {
  return price > 0 ? EventType.PAID : EventType.FREE;
}

function buildLiveRoom(eventSlug: string): { liveRoomId: string; liveRoomUrl: string } {
  const liveRoomId = `event-${eventSlug}`;
  const room = liveRoomNameFromSessionSlug(liveRoomId);
  const base =
    process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.trim() ||
    process.env.ACADEMY_LIVE_BASE_URL?.trim() ||
    "https://live.mcbuleli.org";
  return { liveRoomId, liveRoomUrl: `${base.replace(/\/$/, "")}/${room}` };
}

function mapPublic(row: typeof academyTrainingEvents.$inferSelect, participantCount?: number): EventPublicView {
  const pub = eventToPublic(row, { participantCount });
  const { liveRoomUrl: _hidden, ...rest } = pub;
  return rest as EventPublicView;
}

export async function createEvent(args: {
  input: CreateEventInput;
  createdBy: string;
}): Promise<{ ok: true; event: EventPublicView } | { ok: false; code: string }> {
  const start = new Date(args.input.startDate);
  const end = new Date(args.input.endDate);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    return { ok: false, code: "event_invalid_dates" };
  }

  const price = args.input.price ?? 0;
  const slug = await uniqueSlug(slugify(args.input.title));
  const durationMinutes =
    args.input.durationMinutes ??
    Math.max(1, Math.round((end.getTime() - start.getTime()) / 60_000));

  const db = getDb();
  const [row] = await db
    .insert(academyTrainingEvents)
    .values({
      slug,
      title: args.input.title.trim(),
      description: (args.input.description ?? "").trim(),
      category: args.input.category ?? "training",
      coverImage: args.input.coverImage ?? null,
      trainerId: args.input.trainerId,
      trainerName: args.input.trainerName.trim(),
      startDate: start,
      endDate: end,
      timezone: args.input.timezone ?? "Africa/Kinshasa",
      durationMinutes,
      locationType: args.input.locationType ?? "ONLINE",
      maxParticipants: args.input.maxParticipants ?? null,
      price: fmtWalletAmount(price),
      currency: args.input.currency ?? "USDT",
      eventType: args.input.eventType ?? deriveEventType(price),
      visibility: args.input.visibility ?? "COMMUNITY",
      audienceMode: args.input.audienceMode ?? EventAudienceMode.MANUAL,
      status: EventStatus.DRAFT,
      createdBy: args.createdBy,
    })
    .returning();

  if (!row) return { ok: false, code: "event_create_failed" };
  return { ok: true, event: mapPublic(row) };
}

export async function listEvents(args: {
  userId?: string | null;
  appRole?: UserRoleType | null;
  status?: string;
  upcoming?: boolean;
}): Promise<EventPublicView[]> {
  const db = getDb();
  const conditions = [];
  if (args.status) {
    conditions.push(eq(academyTrainingEvents.status, args.status));
  } else if (!args.userId || resolveEventRole({ userId: args.userId, appRole: args.appRole ?? "user" }) === "STUDENT") {
    conditions.push(
      inArray(academyTrainingEvents.status, [
        EventStatus.PUBLISHED,
        EventStatus.LIVE,
        EventStatus.COMPLETED,
      ]),
    );
  }
  if (args.upcoming) {
    conditions.push(gte(academyTrainingEvents.startDate, new Date()));
  }

  const rows =
    conditions.length > 0
      ? await db
          .select()
          .from(academyTrainingEvents)
          .where(and(...conditions))
          .orderBy(academyTrainingEvents.startDate)
      : await db.select().from(academyTrainingEvents).orderBy(academyTrainingEvents.startDate);

  const out: EventPublicView[] = [];
  for (const row of rows) {
    if (args.userId) {
      const role = resolveEventRole({ userId: args.userId, appRole: args.appRole ?? "user", event: row });
      const [en] = await db
        .select({ id: academyTrainingEventParticipants.id })
        .from(academyTrainingEventParticipants)
        .where(
          and(
            eq(academyTrainingEventParticipants.eventId, row.id),
            eq(academyTrainingEventParticipants.userId, args.userId),
          ),
        )
        .limit(1);
      if (!canViewEvent({ role, userId: args.userId, event: row, enrolled: Boolean(en) })) {
        continue;
      }
    } else if (row.visibility === "PRIVATE" || row.status === EventStatus.DRAFT) {
      continue;
    }
    out.push(mapPublic(row));
  }
  return out;
}

export async function getEventByIdOrSlug(idOrSlug: string): Promise<
  typeof academyTrainingEvents.$inferSelect | null
> {
  const db = getDb();
  const [bySlug] = await db
    .select()
    .from(academyTrainingEvents)
    .where(eq(academyTrainingEvents.slug, idOrSlug))
    .limit(1);
  if (bySlug) return bySlug;

  const [byId] = await db
    .select()
    .from(academyTrainingEvents)
    .where(eq(academyTrainingEvents.id, idOrSlug))
    .limit(1);
  return byId ?? null;
}

export async function getEventPublic(args: {
  idOrSlug: string;
  userId?: string | null;
  appRole?: UserRoleType | null;
}): Promise<{ ok: true; event: EventPublicView } | { ok: false; code: string }> {
  const row = await getEventByIdOrSlug(args.idOrSlug);
  if (!row) return { ok: false, code: "event_not_found" };

  let enrolled = false;
  if (args.userId) {
    const role = resolveEventRole({ userId: args.userId, appRole: args.appRole ?? "user", event: row });
    const [en] = await getDb()
      .select({ id: academyTrainingEventParticipants.id })
      .from(academyTrainingEventParticipants)
      .where(
        and(
          eq(academyTrainingEventParticipants.eventId, row.id),
          eq(academyTrainingEventParticipants.userId, args.userId),
        ),
      )
      .limit(1);
    enrolled = Boolean(en);
    if (!canViewEvent({ role, userId: args.userId, event: row, enrolled })) {
      return { ok: false, code: "event_forbidden" };
    }
  } else if (row.visibility === "PRIVATE" || row.status === EventStatus.DRAFT) {
    return { ok: false, code: "event_forbidden" };
  }

  const db = getDb();
  const [pc] = await db
    .select({ c: count() })
    .from(academyTrainingEventParticipants)
    .where(
      and(
        eq(academyTrainingEventParticipants.eventId, row.id),
        eq(academyTrainingEventParticipants.participantStatus, ParticipantStatus.ENROLLED),
      ),
    );

  return { ok: true, event: mapPublic(row, Number(pc?.c ?? 0)) };
}

export async function updateEvent(args: {
  idOrSlug: string;
  userId: string;
  appRole: UserRoleType;
  patch: Partial<CreateEventInput>;
}): Promise<{ ok: true; event: EventPublicView } | { ok: false; code: string }> {
  const row = await getEventByIdOrSlug(args.idOrSlug);
  if (!row) return { ok: false, code: "event_not_found" };

  const role = resolveEventRole({ userId: args.userId, appRole: args.appRole, event: row });
  if (!canEditEvent({ role, userId: args.userId, event: row })) {
    return { ok: false, code: "event_forbidden" };
  }

  const price = args.patch.price ?? numFromNumeric(row.price);
  const start = args.patch.startDate ? new Date(args.patch.startDate) : row.startDate;
  const end = args.patch.endDate ? new Date(args.patch.endDate) : row.endDate;

  const db = getDb();
  const [updated] = await db
    .update(academyTrainingEvents)
    .set({
      title: args.patch.title?.trim() ?? row.title,
      description: args.patch.description?.trim() ?? row.description,
      category: args.patch.category ?? row.category,
      coverImage: args.patch.coverImage !== undefined ? args.patch.coverImage : row.coverImage,
      trainerId: args.patch.trainerId ?? row.trainerId,
      trainerName: args.patch.trainerName?.trim() ?? row.trainerName,
      startDate: start,
      endDate: end,
      timezone: args.patch.timezone ?? row.timezone,
      durationMinutes: args.patch.durationMinutes ?? row.durationMinutes,
      locationType: args.patch.locationType ?? row.locationType,
      maxParticipants:
        args.patch.maxParticipants !== undefined
          ? args.patch.maxParticipants
          : row.maxParticipants,
      price: fmtWalletAmount(price),
      eventType: args.patch.eventType ?? deriveEventType(price),
      visibility: args.patch.visibility ?? row.visibility,
      audienceMode: args.patch.audienceMode ?? row.audienceMode,
      updatedAt: new Date(),
    })
    .where(eq(academyTrainingEvents.id, row.id))
    .returning();

  if (!updated) return { ok: false, code: "event_update_failed" };

  if ([EventStatus.PUBLISHED, EventStatus.LIVE].includes(updated.status as typeof EventStatus.PUBLISHED)) {
    await syncEventCommunityPost(updated.id);
  }

  return { ok: true, event: mapPublic(updated) };
}

export async function deleteEvent(args: {
  idOrSlug: string;
  userId: string;
  appRole: UserRoleType;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const row = await getEventByIdOrSlug(args.idOrSlug);
  if (!row) return { ok: false, code: "event_not_found" };
  const role = resolveEventRole({ userId: args.userId, appRole: args.appRole, event: row });
  if (!canEditEvent({ role, userId: args.userId, event: row })) {
    return { ok: false, code: "event_forbidden" };
  }

  await getDb()
    .update(academyTrainingEvents)
    .set({ status: EventStatus.CANCELLED, updatedAt: new Date() })
    .where(eq(academyTrainingEvents.id, row.id));

  return { ok: true };
}

async function autoEnrollAcademyMembers(
  eventId: string,
  editionId: string | null,
): Promise<number> {
  const db = getDb();
  const members = editionId
    ? await db
        .selectDistinct({ userId: academyEnrollments.userId })
        .from(academyEnrollments)
        .where(
          and(
            eq(academyEnrollments.status, "active"),
            eq(academyEnrollments.editionId, editionId),
          ),
        )
    : await db
        .selectDistinct({ userId: academyEnrollments.userId })
        .from(academyEnrollments)
        .where(eq(academyEnrollments.status, "active"));

  let n = 0;
  for (const m of members) {
    const inserted = await db
      .insert(academyTrainingEventParticipants)
      .values({
        eventId,
        userId: m.userId,
        participantStatus: ParticipantStatus.ENROLLED,
        paymentStatus: PaymentStatus.FREE,
      })
      .onConflictDoNothing()
      .returning({ id: academyTrainingEventParticipants.id });
    if (inserted.length) n += 1;
  }
  return n;
}

export async function publishEvent(args: {
  idOrSlug: string;
  userId: string;
  appRole: UserRoleType;
}): Promise<
  | { ok: true; event: EventPublicView; autoEnrolled: number; communityPostId: string | null }
  | { ok: false; code: string }
> {
  const row = await getEventByIdOrSlug(args.idOrSlug);
  if (!row) return { ok: false, code: "event_not_found" };
  const role = resolveEventRole({ userId: args.userId, appRole: args.appRole, event: row });
  if (!canEditEvent({ role, userId: args.userId, event: row })) {
    return { ok: false, code: "event_forbidden" };
  }
  if (row.status !== EventStatus.DRAFT && row.status !== EventStatus.PUBLISHED) {
    return { ok: false, code: "event_invalid_status" };
  }

  const live = buildLiveRoom(row.slug);
  const db = getDb();
  const [updated] = await db
    .update(academyTrainingEvents)
    .set({
      status: EventStatus.PUBLISHED,
      liveRoomId: live.liveRoomId,
      liveRoomUrl: live.liveRoomUrl,
      updatedAt: new Date(),
    })
    .where(eq(academyTrainingEvents.id, row.id))
    .returning();

  if (!updated) return { ok: false, code: "event_publish_failed" };

  let autoEnrolled = 0;
  if (
    updated.audienceMode === EventAudienceMode.ALL_ACADEMY_MEMBERS &&
    updated.eventType === EventType.FREE
  ) {
    autoEnrolled = await autoEnrollAcademyMembers(updated.id, updated.editionId);
  }

  const communityPostId = await syncEventCommunityPost(updated.id);
  return { ok: true, event: mapPublic(updated), autoEnrolled, communityPostId };
}

export async function joinEvent(args: {
  idOrSlug: string;
  userId: string;
}): Promise<
  | { ok: true; status: string; paymentStatus: string; needsPayment: boolean }
  | { ok: false; code: string }
> {
  const row = await getEventByIdOrSlug(args.idOrSlug);
  if (!row || ![EventStatus.PUBLISHED, EventStatus.LIVE].includes(row.status as "PUBLISHED" | "LIVE")) {
    return { ok: false, code: "event_not_open" };
  }

  const db = getDb();
  const price = numFromNumeric(row.price);
  const isPaid = row.eventType === EventType.PAID || price > 0;

  const [existing] = await db
    .select()
    .from(academyTrainingEventParticipants)
    .where(
      and(
        eq(academyTrainingEventParticipants.eventId, row.id),
        eq(academyTrainingEventParticipants.userId, args.userId),
      ),
    )
    .limit(1);

  if (existing) {
    return {
      ok: true,
      status: existing.participantStatus,
      paymentStatus: existing.paymentStatus,
      needsPayment: isPaid && existing.paymentStatus !== PaymentStatus.PAID,
    };
  }

  if (row.maxParticipants) {
    const [cap] = await db
      .select({ c: count() })
      .from(academyTrainingEventParticipants)
      .where(
        and(
          eq(academyTrainingEventParticipants.eventId, row.id),
          eq(academyTrainingEventParticipants.participantStatus, ParticipantStatus.ENROLLED),
        ),
      );
    if (Number(cap?.c ?? 0) >= row.maxParticipants) {
      return { ok: false, code: "event_full" };
    }
  }

  const participantStatus = isPaid ? ParticipantStatus.INVITED : ParticipantStatus.ENROLLED;
  const paymentStatus = isPaid ? PaymentStatus.PENDING : PaymentStatus.FREE;

  await db.insert(academyTrainingEventParticipants).values({
    eventId: row.id,
    userId: args.userId,
    participantStatus,
    paymentStatus,
  });

  return {
    ok: true,
    status: participantStatus,
    paymentStatus,
    needsPayment: isPaid,
  };
}

export async function payForEvent(args: {
  idOrSlug: string;
  userId: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const row = await getEventByIdOrSlug(args.idOrSlug);
  if (!row) return { ok: false, code: "event_not_found" };
  const price = numFromNumeric(row.price);
  if (price <= 0) return { ok: false, code: "event_free" };

  const db = getDb();
  const [part] = await db
    .select()
    .from(academyTrainingEventParticipants)
    .where(
      and(
        eq(academyTrainingEventParticipants.eventId, row.id),
        eq(academyTrainingEventParticipants.userId, args.userId),
      ),
    )
    .limit(1);
  if (!part) return { ok: false, code: "event_not_joined" };
  if (part.paymentStatus === PaymentStatus.PAID) return { ok: true };

  const priceStr = fmtWalletAmount(price);
  try {
    await db.transaction(async (tx) => {
      const [deducted] = await tx
        .update(users)
        .set({ balance: sql`${users.balance} - ${priceStr}::numeric` })
        .where(and(eq(users.id, args.userId), sql`${users.balance} >= ${priceStr}::numeric`))
        .returning({ id: users.id });
      if (!deducted) throw new Error("event_insufficient_balance");

      await insertLedger(tx, [
        {
          batchId: randomUUID(),
          userId: args.userId,
          entryType: "event_enrollment",
          asset: "USDT",
          amount: `-${priceStr}`,
          feeUsdEquivalent: "0",
          meta: { eventId: row.id, eventSlug: row.slug },
        },
      ]);

      await tx
        .update(academyTrainingEventParticipants)
        .set({
          paymentStatus: PaymentStatus.PAID,
          participantStatus: ParticipantStatus.ENROLLED,
        })
        .where(eq(academyTrainingEventParticipants.id, part.id));
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "event_insufficient_balance") {
      await db
        .update(academyTrainingEventParticipants)
        .set({ paymentStatus: PaymentStatus.FAILED })
        .where(eq(academyTrainingEventParticipants.id, part.id));
      return { ok: false, code: "event_insufficient_balance" };
    }
    return { ok: false, code: "event_payment_failed" };
  }

  return { ok: true };
}

export async function listEventParticipants(eventId: string): Promise<
  {
    id: string;
    userId: string;
    participantStatus: string;
    paymentStatus: string;
    joinedAt: Date;
    email: string | null;
  }[]
> {
  const db = getDb();
  return db
    .select({
      id: academyTrainingEventParticipants.id,
      userId: academyTrainingEventParticipants.userId,
      participantStatus: academyTrainingEventParticipants.participantStatus,
      paymentStatus: academyTrainingEventParticipants.paymentStatus,
      joinedAt: academyTrainingEventParticipants.joinedAt,
      email: users.email,
    })
    .from(academyTrainingEventParticipants)
    .innerJoin(users, eq(academyTrainingEventParticipants.userId, users.id))
    .where(eq(academyTrainingEventParticipants.eventId, eventId))
    .orderBy(academyTrainingEventParticipants.joinedAt);
}

export async function getEventDashboardKpis(): Promise<EventDashboardKpis> {
  const db = getDb();
  const now = new Date();

  const [ev] = await db.select({ c: count() }).from(academyTrainingEvents);
  const [upcoming] = await db
    .select({ c: count() })
    .from(academyTrainingEvents)
    .where(
      and(
        gte(academyTrainingEvents.startDate, now),
        inArray(academyTrainingEvents.status, [EventStatus.PUBLISHED, EventStatus.LIVE]),
      ),
    );
  const [enrolled] = await db
    .select({ c: count() })
    .from(academyTrainingEventParticipants)
    .where(eq(academyTrainingEventParticipants.participantStatus, ParticipantStatus.ENROLLED));
  const [attended] = await db
    .select({ c: count() })
    .from(academyTrainingEventParticipants)
    .where(eq(academyTrainingEventParticipants.participantStatus, ParticipantStatus.ATTENDED));

  const enrolledN = Number(enrolled?.c ?? 0);
  const attendedN = Number(attended?.c ?? 0);

  const paidRows = await db
    .select({ price: academyTrainingEvents.price })
    .from(academyTrainingEventParticipants)
    .innerJoin(
      academyTrainingEvents,
      eq(academyTrainingEventParticipants.eventId, academyTrainingEvents.id),
    )
    .where(eq(academyTrainingEventParticipants.paymentStatus, PaymentStatus.PAID));

  let revenueUsdt = 0;
  for (const r of paidRows) revenueUsdt += numFromNumeric(r.price);

  return {
    totalEvents: Number(ev?.c ?? 0),
    enrolledParticipants: enrolledN,
    attendedParticipants: attendedN,
    participationRate: enrolledN > 0 ? (attendedN / enrolledN) * 100 : 0,
    revenueUsdt,
    upcomingCount: Number(upcoming?.c ?? 0),
  };
}

export async function syncEventLifecycleStatuses(): Promise<{ live: number; completed: number }> {
  const db = getDb();
  const now = new Date();

  const liveRows = await db
    .update(academyTrainingEvents)
    .set({ status: EventStatus.LIVE, updatedAt: now })
    .where(
      and(
        eq(academyTrainingEvents.status, EventStatus.PUBLISHED),
        lte(academyTrainingEvents.startDate, now),
        gte(academyTrainingEvents.endDate, now),
      ),
    )
    .returning({ id: academyTrainingEvents.id });

  const doneRows = await db
    .update(academyTrainingEvents)
    .set({ status: EventStatus.COMPLETED, updatedAt: now })
    .where(
      and(
        inArray(academyTrainingEvents.status, [EventStatus.PUBLISHED, EventStatus.LIVE]),
        lte(academyTrainingEvents.endDate, now),
      ),
    )
    .returning({ id: academyTrainingEvents.id });

  return { live: liveRows.length, completed: doneRows.length };
}

export function getEventLiveJoinPath(slug: string): string {
  return getAppAbsoluteUrl(`/app/events/${slug}/live`);
}

export async function getEventLiveUrlForUser(args: {
  idOrSlug: string;
  userId: string;
}): Promise<{ ok: true; url: string; platform: "McBuleli Live" } | { ok: false; code: string }> {
  const row = await getEventByIdOrSlug(args.idOrSlug);
  if (!row || !row.liveRoomUrl) return { ok: false, code: "event_live_unavailable" };

  const [part] = await getDb()
    .select()
    .from(academyTrainingEventParticipants)
    .where(
      and(
        eq(academyTrainingEventParticipants.eventId, row.id),
        eq(academyTrainingEventParticipants.userId, args.userId),
        eq(academyTrainingEventParticipants.participantStatus, ParticipantStatus.ENROLLED),
      ),
    )
    .limit(1);
  if (!part) return { ok: false, code: "event_not_enrolled" };

  return { ok: true, url: row.liveRoomUrl, platform: "McBuleli Live" };
}
