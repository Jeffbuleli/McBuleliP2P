import { and, count, eq, sql } from "drizzle-orm";
import {
  academyAttendance,
  academyEnrollments,
  academySessions,
  academyTrainingEvents,
  getDb,
} from "@/db";
import { ACADEMY_CHECKIN_WINDOW_MIN } from "@/lib/academy-config";
import { resolveLiveSessionRecord } from "@/lib/academy-live-resolve";
import { resolveAcademyReplayPlayUrl } from "@/lib/academy-replay-url";

export type LiveSessionStatsView = {
  sessionTitle: string;
  sessionSlug: string;
  editionSlug: string;
  programSlug: string;
  startsAt: string;
  endsAt: string | null;
  durationMinutes: number;
  attendeesCount: number;
  cohortEnrolled: number;
  checkedIn: boolean;
  replayUrl: string | null;
  liveStartedAt: string | null;
};

export async function getLiveSessionStats(args: {
  userId: string;
  editionSlug: string;
  sessionSlug: string;
  programSlug?: string;
}): Promise<LiveSessionStatsView | null> {
  const row = await resolveLiveSessionRecord({
    editionSlug: args.editionSlug,
    programSlug: args.programSlug,
    sessionSlug: args.sessionSlug,
  });
  if (!row) return null;

  const db = getDb();
  const durationMinutes = row.endsAt
    ? Math.max(1, Math.round((row.endsAt.getTime() - row.startsAt.getTime()) / 60_000))
    : 120;

  const [attRow] = await db
    .select({ n: sql<number>`count(distinct ${academyAttendance.userId})::int` })
    .from(academyAttendance)
    .where(eq(academyAttendance.sessionId, row.attendanceSessionId));

  const [cohortRow] = await db
    .select({ n: count() })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.editionId, row.editionId),
        eq(academyEnrollments.status, "active"),
      ),
    );

  const [enrollment] = await db
    .select({ id: academyEnrollments.id })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.userId, args.userId),
        eq(academyEnrollments.editionId, row.editionId),
        eq(academyEnrollments.status, "active"),
      ),
    )
    .limit(1);

  let checkedIn = false;
  if (enrollment) {
    const [att] = await db
      .select({ id: academyAttendance.id })
      .from(academyAttendance)
      .where(
        and(
          eq(academyAttendance.enrollmentId, enrollment.id),
          eq(academyAttendance.sessionId, row.attendanceSessionId),
        ),
      )
      .limit(1);
    checkedIn = !!att;
  }

  let replayUrl: string | null = null;
  if (row.recordKind === "academy_session") {
    const [session] = await db
      .select({
        replayUrl: academySessions.replayUrl,
        replayR2Key: academySessions.replayR2Key,
      })
      .from(academySessions)
      .where(eq(academySessions.id, row.recordId))
      .limit(1);
    replayUrl = resolveAcademyReplayPlayUrl(session ?? {});
  } else {
    const [event] = await db
      .select({ replayR2Key: academyTrainingEvents.replayR2Key })
      .from(academyTrainingEvents)
      .where(eq(academyTrainingEvents.id, row.recordId))
      .limit(1);
    replayUrl = resolveAcademyReplayPlayUrl({
      replayUrl: null,
      replayR2Key: event?.replayR2Key ?? null,
    });
  }

  return {
    sessionTitle: row.sessionTitle,
    sessionSlug: row.sessionSlug,
    editionSlug: row.editionSlug,
    programSlug: row.programSlug,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    durationMinutes,
    attendeesCount: attRow?.n ?? 0,
    cohortEnrolled: cohortRow?.n ?? 0,
    checkedIn,
    replayUrl,
    liveStartedAt: row.liveStartedAt?.toISOString() ?? null,
  };
}

/** Resolve attendance target session id (academy_sessions FK). */
export async function resolveAttendanceSessionId(
  sessionId: string,
): Promise<
  | {
      ok: true;
      sessionId: string;
      editionId: string;
      slug: string;
      startsAt: Date;
      endsAt: Date | null;
    }
  | { ok: false; code: string }
> {
  const db = getDb();
  const [session] = await db
    .select()
    .from(academySessions)
    .where(eq(academySessions.id, sessionId))
    .limit(1);
  if (session) {
    return {
      ok: true,
      sessionId: session.id,
      editionId: session.editionId,
      slug: session.slug,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
    };
  }

  const [event] = await db
    .select()
    .from(academyTrainingEvents)
    .where(eq(academyTrainingEvents.id, sessionId))
    .limit(1);
  if (!event?.legacySessionId) {
    return { ok: false, code: "academy_session_not_found" };
  }

  const [legacy] = await db
    .select()
    .from(academySessions)
    .where(eq(academySessions.id, event.legacySessionId))
    .limit(1);
  if (!legacy) {
    return { ok: false, code: "academy_session_not_found" };
  }

  return {
    ok: true,
    sessionId: legacy.id,
    editionId: legacy.editionId,
    slug: legacy.slug,
    startsAt: legacy.startsAt,
    endsAt: legacy.endsAt,
  };
}

export function isWithinCheckInWindow(args: {
  startsAt: Date;
  endsAt: Date | null;
  now?: number;
}): boolean {
  const now = args.now ?? Date.now();
  const start = args.startsAt.getTime();
  const end = args.endsAt?.getTime() ?? start + 2 * 60 * 60 * 1000;
  const winMs = ACADEMY_CHECKIN_WINDOW_MIN * 60 * 1000;
  return now >= start - winMs && now <= end + winMs;
}
