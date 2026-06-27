import { and, eq, inArray, sql } from "drizzle-orm";
import {
  academyEditions,
  academyPrograms,
  academySessions,
  academyTrainingEvents,
  getDb,
} from "@/db";
import { ACADEMY_PROGRAM_LAUNCH } from "@/lib/academy-config";
import { liveRoomNameFromSessionSlug } from "@/lib/academy-jitsi-token";

export type ResolvedLiveSession = {
  editionId: string;
  editionSlug: string;
  programSlug: string;
  liveBaseUrl: string | null;
  sessionSlug: string;
  sessionLiveUrl: string | null;
  sessionTitle: string;
  startsAt: Date;
  endsAt: Date | null;
  liveStartedAt: Date | null;
  recordKind: "academy_session" | "training_event";
  recordId: string;
  attendanceSessionId: string;
};

type AcademyRow = {
  editionId: string;
  editionSlug: string;
  liveBaseUrl: string | null;
  programSlug: string;
  sessionSlug: string;
  sessionLiveUrl: string | null;
  sessionTitle: string;
  startsAt: Date;
  endsAt: Date | null;
  liveStartedAt: Date | null;
  recordId: string;
};

type TrainingRow = AcademyRow & {
  legacySessionId: string | null;
};

function mapAcademyRow(row: AcademyRow): ResolvedLiveSession {
  return {
    ...row,
    recordKind: "academy_session",
    attendanceSessionId: row.recordId,
  };
}

function mapTrainingRow(row: TrainingRow): ResolvedLiveSession {
  return {
    editionId: row.editionId,
    editionSlug: row.editionSlug,
    programSlug: row.programSlug,
    liveBaseUrl: row.liveBaseUrl,
    sessionSlug: row.sessionSlug,
    sessionLiveUrl: row.sessionLiveUrl,
    sessionTitle: row.sessionTitle,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    liveStartedAt: row.liveStartedAt,
    recordKind: "training_event",
    recordId: row.recordId,
    attendanceSessionId: row.legacySessionId ?? row.recordId,
  };
}

async function findTrainingEventRow(args: {
  sessionKey: string;
  editionSlug?: string;
  programSlug?: string;
}): Promise<ResolvedLiveSession | null> {
  const db = getDb();
  const conditions = [
    eq(academyTrainingEvents.slug, args.sessionKey),
    inArray(academyTrainingEvents.status, ["DRAFT", "PUBLISHED", "LIVE"]),
  ];
  if (args.editionSlug?.trim()) {
    conditions.push(eq(academyEditions.slug, args.editionSlug.trim()));
  }
  if (args.programSlug?.trim()) {
    conditions.push(eq(academyPrograms.slug, args.programSlug.trim()));
  }

  const [row] = await db
    .select({
      editionId: academyEditions.id,
      editionSlug: academyEditions.slug,
      liveBaseUrl: academyEditions.liveBaseUrl,
      programSlug: academyPrograms.slug,
      sessionSlug: academyTrainingEvents.slug,
      sessionLiveUrl: academyTrainingEvents.liveRoomUrl,
      sessionTitle: academyTrainingEvents.title,
      startsAt: academyTrainingEvents.startDate,
      endsAt: academyTrainingEvents.endDate,
      liveStartedAt: academyTrainingEvents.liveStartedAt,
      recordId: academyTrainingEvents.id,
      legacySessionId: academyTrainingEvents.legacySessionId,
    })
    .from(academyTrainingEvents)
    .innerJoin(
      academyEditions,
      eq(academyTrainingEvents.editionId, academyEditions.id),
    )
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(and(...conditions))
    .limit(1);

  if (!row) return null;
  return mapTrainingRow(row);
}

async function findAcademySessionRow(args: {
  sessionKey: string;
  editionSlug?: string;
  programSlug?: string;
}): Promise<ResolvedLiveSession | null> {
  const db = getDb();
  const selectShape = {
    editionId: academyEditions.id,
    editionSlug: academyEditions.slug,
    liveBaseUrl: academyEditions.liveBaseUrl,
    programSlug: academyPrograms.slug,
    sessionSlug: academySessions.slug,
    sessionLiveUrl: academySessions.liveUrl,
    sessionTitle: academySessions.titleFr,
    startsAt: academySessions.startsAt,
    endsAt: academySessions.endsAt,
    liveStartedAt: academySessions.liveStartedAt,
    recordId: academySessions.id,
  };

  if (args.editionSlug?.trim()) {
    const [row] = await db
      .select(selectShape)
      .from(academySessions)
      .innerJoin(academyEditions, eq(academySessions.editionId, academyEditions.id))
      .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
      .where(
        args.programSlug
          ? and(
              eq(academyEditions.slug, args.editionSlug.trim()),
              eq(academyPrograms.slug, args.programSlug),
              eq(academySessions.slug, args.sessionKey),
            )
          : and(
              eq(academyEditions.slug, args.editionSlug.trim()),
              eq(academySessions.slug, args.sessionKey),
            ),
      )
      .limit(1);
    if (!row) return null;
    return mapAcademyRow(row);
  }

  const roomKey = liveRoomNameFromSessionSlug(args.sessionKey);
  const rows = await db
    .select(selectShape)
    .from(academySessions)
    .innerJoin(academyEditions, eq(academySessions.editionId, academyEditions.id))
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      sql`lower(${academySessions.slug}) = ${roomKey} OR ${academySessions.slug} = ${args.sessionKey}`,
    )
    .limit(8);

  if (rows.length === 0) return null;
  const picked =
    rows.length === 1
      ? rows[0]
      : rows.find((r) => r.programSlug === ACADEMY_PROGRAM_LAUNCH) ??
        (args.programSlug
          ? rows.find((r) => r.programSlug === args.programSlug)
          : undefined) ??
        rows[0];

  return mapAcademyRow(picked);
}

/** Resolve a live room from academy sessions or training events (formations). */
export async function resolveLiveSessionRecord(args: {
  editionSlug?: string;
  programSlug?: string;
  sessionSlug: string;
}): Promise<ResolvedLiveSession | null> {
  const sessionKey = args.sessionSlug.trim();
  if (!sessionKey) return null;

  const academy = await findAcademySessionRow({
    sessionKey,
    editionSlug: args.editionSlug,
    programSlug: args.programSlug,
  });
  if (academy) return academy;

  return findTrainingEventRow({
    sessionKey,
    editionSlug: args.editionSlug,
    programSlug: args.programSlug,
  });
}

export async function resolveLiveSessionByEdition(args: {
  editionId: string;
  sessionSlug: string;
}): Promise<ResolvedLiveSession | null> {
  const sessionKey = args.sessionSlug.trim();
  if (!sessionKey) return null;

  const db = getDb();
  const [academy] = await db
    .select({
      editionId: academyEditions.id,
      editionSlug: academyEditions.slug,
      liveBaseUrl: academyEditions.liveBaseUrl,
      programSlug: academyPrograms.slug,
      sessionSlug: academySessions.slug,
      sessionLiveUrl: academySessions.liveUrl,
      sessionTitle: academySessions.titleFr,
      startsAt: academySessions.startsAt,
      endsAt: academySessions.endsAt,
      liveStartedAt: academySessions.liveStartedAt,
      recordId: academySessions.id,
    })
    .from(academySessions)
    .innerJoin(academyEditions, eq(academySessions.editionId, academyEditions.id))
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      and(
        eq(academySessions.editionId, args.editionId),
        eq(academySessions.slug, sessionKey),
      ),
    )
    .limit(1);

  if (academy) return mapAcademyRow(academy);

  const [event] = await db
    .select({
      editionId: academyEditions.id,
      editionSlug: academyEditions.slug,
      liveBaseUrl: academyEditions.liveBaseUrl,
      programSlug: academyPrograms.slug,
      sessionSlug: academyTrainingEvents.slug,
      sessionLiveUrl: academyTrainingEvents.liveRoomUrl,
      sessionTitle: academyTrainingEvents.title,
      startsAt: academyTrainingEvents.startDate,
      endsAt: academyTrainingEvents.endDate,
      liveStartedAt: academyTrainingEvents.liveStartedAt,
      recordId: academyTrainingEvents.id,
      legacySessionId: academyTrainingEvents.legacySessionId,
    })
    .from(academyTrainingEvents)
    .innerJoin(academyEditions, eq(academyTrainingEvents.editionId, academyEditions.id))
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      and(
        eq(academyTrainingEvents.editionId, args.editionId),
        eq(academyTrainingEvents.slug, sessionKey),
        inArray(academyTrainingEvents.status, ["DRAFT", "PUBLISHED", "LIVE"]),
      ),
    )
    .limit(1);

  if (!event) return null;
  return mapTrainingRow(event);
}

export async function markResolvedLiveSessionStarted(
  row: ResolvedLiveSession,
): Promise<void> {
  if (row.liveStartedAt) return;
  const db = getDb();
  const now = new Date();
  if (row.recordKind === "academy_session") {
    await db
      .update(academySessions)
      .set({ liveStartedAt: now })
      .where(eq(academySessions.id, row.recordId));
    return;
  }
  await db
    .update(academyTrainingEvents)
    .set({ liveStartedAt: now, status: "LIVE", updatedAt: now })
    .where(eq(academyTrainingEvents.id, row.recordId));
}
