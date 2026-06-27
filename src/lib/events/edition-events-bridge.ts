import { ACADEMY_CHECKIN_WINDOW_MIN } from "@/lib/academy-config";
import {
  buildLiveJoinUrl,
  getLivePhase,
  isSessionEnded,
  isSessionLiveBroadcast,
  isSessionLiveNow,
  liveSessionRemainingSec,
  setupEndsAtIso,
} from "@/lib/academy-live";
import { resolveAcademyReplayPlayUrl } from "@/lib/academy-replay-url";
import type { AcademySessionView } from "@/lib/academy-service";
import { academyTrainingEvents, getDb } from "@/db";
import { asc, eq } from "drizzle-orm";

export async function loadEditionEventsAsSessions(args: {
  editionId: string;
  editionSlug: string;
  liveBaseUrl: string | null;
  enrollmentId: string | null;
  attendedSessionIds: Set<string>;
}): Promise<AcademySessionView[] | null> {
  const db = getDb();
  const events = await db
    .select()
    .from(academyTrainingEvents)
    .where(eq(academyTrainingEvents.editionId, args.editionId))
    .orderBy(asc(academyTrainingEvents.sortOrder), asc(academyTrainingEvents.startDate));

  if (!events.length) return null;

  const now = Date.now();
  const winMs = ACADEMY_CHECKIN_WINDOW_MIN * 60 * 1000;

  return events.map((ev) => {
    const sessionId = ev.legacySessionId ?? ev.id;
    const start = ev.startDate.getTime();
    const end = ev.endDate.getTime();
    const canCheckIn =
      !!args.enrollmentId &&
      now >= start - winMs &&
      now <= end + winMs &&
      !args.attendedSessionIds.has(sessionId);
    const liveNow = isSessionLiveBroadcast({ startsAt: ev.startDate, endsAt: ev.endDate });
    const ended = isSessionEnded({ startsAt: ev.startDate, endsAt: ev.endDate });
    const livePhase = getLivePhase({ startsAt: ev.startDate, endsAt: ev.endDate });
    const replayUrl = resolveAcademyReplayPlayUrl({
      replayUrl: null,
      replayR2Key: ev.replayR2Key,
    });
    const sessionTitle = ev.title;
    const joinBase = {
      editionSlug: args.editionSlug,
      sessionSlug: ev.slug,
      sessionLiveUrl: ev.liveRoomUrl,
      liveBaseUrl: args.liveBaseUrl,
      sessionTitle,
    };
    const remaining = liveSessionRemainingSec({
      startsAt: ev.startDate,
      endsAt: ev.endDate,
      now,
    });

    return {
      id: sessionId,
      slug: ev.slug,
      title: sessionTitle,
      kind: "live",
      startsAt: ev.startDate.toISOString(),
      endsAt: ev.endDate.toISOString(),
      liveUrl: ev.liveRoomUrl,
      liveJoinUrl: buildLiveJoinUrl({ ...joinBase, mode: "learner" }),
      liveJoinUrlHost: buildLiveJoinUrl({ ...joinBase, mode: "host" }),
      liveJoinUrlAudio: buildLiveJoinUrl({ ...joinBase, mode: "audio" }),
      remainingSec: remaining.seconds,
      remainingKind: remaining.kind,
      isLiveNow: liveNow,
      livePhase,
      setupEndsAt: setupEndsAtIso(ev.startDate),
      liveStartedAt: ev.liveStartedAt?.toISOString() ?? null,
      replayUrl: ended ? replayUrl : null,
      hasReplay: ended && !!replayUrl,
      checkedIn: args.attendedSessionIds.has(sessionId),
      canCheckIn,
    };
  });
}
