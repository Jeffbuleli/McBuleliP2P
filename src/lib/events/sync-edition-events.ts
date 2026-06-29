import { and, asc, eq } from "drizzle-orm";
import {
  academyEditionHosts,
  academyEditions,
  academyEnrollments,
  academyPrograms,
  academySessions,
  academyTrainingEventParticipants,
  academyTrainingEvents,
  getDb,
  users,
} from "@/db";
import { liveRoomNameFromSessionSlug } from "@/lib/academy-jitsi-token";
import {
  EventAudienceMode,
  EventStatus,
  EventType,
  EventVisibility,
  ParticipantStatus,
  PaymentStatus,
} from "@/lib/events/types";

async function resolveDefaultTrainer(
  editionId: string,
): Promise<{ id: string; name: string }> {
  const db = getDb();
  const [host] = await db
    .select({
      userId: academyEditionHosts.userId,
      displayName: users.displayName,
      email: users.email,
    })
    .from(academyEditionHosts)
    .innerJoin(users, eq(academyEditionHosts.userId, users.id))
    .where(eq(academyEditionHosts.editionId, editionId))
    .limit(1);
  if (host) {
    return {
      id: host.userId,
      name: host.displayName?.trim() || host.email?.split("@")[0] || "McBuleli",
    };
  }

  const [admin] = await db
    .select({ id: users.id, displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.role, "super_admin"))
    .limit(1);
  if (admin) {
    return {
      id: admin.id,
      name: admin.displayName?.trim() || admin.email?.split("@")[0] || "McBuleli",
    };
  }

  const [any] = await db
    .select({ id: users.id, displayName: users.displayName, email: users.email })
    .from(users)
    .limit(1);
  if (!any) throw new Error("no_users_for_trainer");
  return {
    id: any.id,
    name: any.displayName?.trim() || any.email?.split("@")[0] || "McBuleli",
  };
}

function buildLiveRoomUrl(
  slug: string,
  editionLiveBase: string | null,
  sessionLiveUrl: string | null,
): { liveRoomId: string; liveRoomUrl: string } {
  if (sessionLiveUrl?.trim()) {
    return { liveRoomId: slug, liveRoomUrl: sessionLiveUrl.trim() };
  }
  const room = liveRoomNameFromSessionSlug(slug);
  const base =
    editionLiveBase?.trim() ||
    process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.trim() ||
    process.env.ACADEMY_LIVE_BASE_URL?.trim() ||
    "https://live.mcbuleli.org";
  return { liveRoomId: slug, liveRoomUrl: `${base.replace(/\/$/, "")}/${room}` };
}

function deriveEventStatus(startsAt: Date, endsAt: Date | null): string {
  const now = Date.now();
  if (endsAt && endsAt.getTime() < now) return EventStatus.COMPLETED;
  if (startsAt.getTime() <= now && (!endsAt || endsAt.getTime() >= now)) {
    return EventStatus.LIVE;
  }
  return EventStatus.PUBLISHED;
}

async function autoEnrollEditionMembers(
  eventId: string,
  editionId: string,
): Promise<number> {
  const db = getDb();
  const members = await db
    .selectDistinct({ userId: academyEnrollments.userId })
    .from(academyEnrollments)
    .where(
      and(eq(academyEnrollments.status, "active"), eq(academyEnrollments.editionId, editionId)),
    );

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

/** Sync academy_sessions → academy_training_events (SSOT). Idempotent. */
export async function syncEditionEventsFromSessions(editionId: string): Promise<number> {
  const db = getDb();
  const sessions = await db
    .select()
    .from(academySessions)
    .where(eq(academySessions.editionId, editionId))
    .orderBy(asc(academySessions.sortOrder), asc(academySessions.startsAt));

  if (!sessions.length) return 0;

  const [editionRow] = await db
    .select({ edition: academyEditions, program: academyPrograms })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(eq(academyEditions.id, editionId))
    .limit(1);
  if (!editionRow) return 0;

  const trainer = await resolveDefaultTrainer(editionId);
  let synced = 0;

  for (const s of sessions) {
    const [existing] = await db
      .select({ id: academyTrainingEvents.id, status: academyTrainingEvents.status })
      .from(academyTrainingEvents)
      .where(eq(academyTrainingEvents.legacySessionId, s.id))
      .limit(1);

    const durationMinutes = s.endsAt
      ? Math.max(1, Math.round((s.endsAt.getTime() - s.startsAt.getTime()) / 60_000))
      : 120;
    const endDate = s.endsAt ?? new Date(s.startsAt.getTime() + durationMinutes * 60_000);
    const live = buildLiveRoomUrl(s.slug, editionRow.edition.liveBaseUrl, s.liveUrl);
    const status = existing?.status ?? deriveEventStatus(s.startsAt, s.endsAt);
    const cohortVisibility = EventVisibility.PRIVATE;

    if (existing) {
      await db
        .update(academyTrainingEvents)
        .set({
          title: s.titleFr,
          startDate: s.startsAt,
          endDate,
          durationMinutes,
          liveRoomId: live.liveRoomId,
          liveRoomUrl: live.liveRoomUrl,
          replayR2Key: s.replayR2Key,
          liveStartedAt: s.liveStartedAt,
          sortOrder: s.sortOrder,
          editionId,
          updatedAt: new Date(),
        })
        .where(eq(academyTrainingEvents.id, existing.id));
      continue;
    }

    const [created] = await db
      .insert(academyTrainingEvents)
      .values({
        slug: s.slug,
        title: s.titleFr,
        description: `${editionRow.edition.titleFr} - ${s.titleFr}`,
        category: "cohort-live",
        trainerId: trainer.id,
        trainerName: trainer.name,
        startDate: s.startsAt,
        endDate,
        durationMinutes,
        liveRoomId: live.liveRoomId,
        liveRoomUrl: live.liveRoomUrl,
        eventType: EventType.FREE,
        visibility: cohortVisibility,
        audienceMode: EventAudienceMode.ALL_ACADEMY_MEMBERS,
        status,
        editionId,
        legacySessionId: s.id,
        sortOrder: s.sortOrder,
        replayR2Key: s.replayR2Key,
        liveStartedAt: s.liveStartedAt,
        createdBy: trainer.id,
      })
      .returning();

    if (created) {
      await autoEnrollEditionMembers(created.id, editionId);
      synced += 1;
    }
  }

  return synced;
}

export async function ensureAllEditionEventsSynced(): Promise<void> {
  const db = getDb();
  const editions = await db.select({ id: academyEditions.id }).from(academyEditions);
  for (const e of editions) {
    await syncEditionEventsFromSessions(e.id);
  }
}
