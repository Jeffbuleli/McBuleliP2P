import { and, count, eq, sql } from "drizzle-orm";
import {
  academyAttendance,
  academyEditions,
  academyEnrollments,
  academyLearningEvents,
  academyModuleProgress,
  academyModules,
  academyPrograms,
  academyQuizAttempts,
  academyQuizzes,
  getDb,
} from "@/db";

export type EditionInstructorAnalytics = {
  editionSlug: string;
  programSlug: string;
  enrollmentsActive: number;
  livesAttended: number;
  quizPasses: number;
  modulesCompleted: number;
  replayViews: number;
  eventsByVerb: { verb: string; n: number }[];
};

export async function getEditionInstructorAnalytics(
  editionSlug: string,
): Promise<EditionInstructorAnalytics | null> {
  const db = getDb();
  const [edition] = await db
    .select({
      id: academyEditions.id,
      slug: academyEditions.slug,
      programSlug: academyPrograms.slug,
    })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(eq(academyEditions.slug, editionSlug))
    .limit(1);
  if (!edition) return null;

  const [enrollRow] = await db
    .select({ n: count() })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.editionId, edition.id),
        eq(academyEnrollments.status, "active"),
      ),
    );

  const [attRow] = await db
    .select({
      n: sql<number>`count(distinct ${academyAttendance.enrollmentId})::int`,
    })
    .from(academyAttendance)
    .innerJoin(
      academyEnrollments,
      eq(academyAttendance.enrollmentId, academyEnrollments.id),
    )
    .where(eq(academyEnrollments.editionId, edition.id));

  const [quizPassRow] = await db
    .select({
      n: sql<number>`count(distinct ${academyQuizAttempts.userId})::int`,
    })
    .from(academyQuizAttempts)
    .innerJoin(academyQuizzes, eq(academyQuizAttempts.quizId, academyQuizzes.id))
    .where(
      and(
        eq(academyQuizzes.editionId, edition.id),
        eq(academyQuizAttempts.passed, true),
      ),
    );

  const [modRow] = await db
    .select({ n: count() })
    .from(academyModuleProgress)
    .innerJoin(academyModules, eq(academyModuleProgress.moduleId, academyModules.id))
    .where(eq(academyModules.editionId, edition.id));

  const [replayRow] = await db
    .select({ n: count() })
    .from(academyLearningEvents)
    .where(
      and(
        eq(academyLearningEvents.editionId, edition.id),
        eq(academyLearningEvents.verb, "replay_viewed"),
      ),
    );

  const eventRows = await db
    .select({
      verb: academyLearningEvents.verb,
      n: sql<number>`count(*)::int`,
    })
    .from(academyLearningEvents)
    .where(eq(academyLearningEvents.editionId, edition.id))
    .groupBy(academyLearningEvents.verb);

  return {
    editionSlug: edition.slug,
    programSlug: edition.programSlug,
    enrollmentsActive: enrollRow?.n ?? 0,
    livesAttended: attRow?.n ?? 0,
    quizPasses: quizPassRow?.n ?? 0,
    modulesCompleted: modRow?.n ?? 0,
    replayViews: replayRow?.n ?? 0,
    eventsByVerb: eventRows.map((r) => ({ verb: r.verb, n: r.n })),
  };
}
