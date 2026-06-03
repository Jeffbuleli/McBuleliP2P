import { and, asc, desc, eq } from "drizzle-orm";
import {
  academyEditions,
  academyLearningEvents,
  academyModuleProgress,
  academyModules,
  academyPrograms,
  getDb,
} from "@/db";
import type { AcademyJourneySnapshot } from "@/lib/academy-journey";
import type { AcademyMentorLearnerContext } from "@/lib/academy-mentor-context";
import { resolveEditionIdBySlug } from "@/lib/academy-cohort-messaging";
import { getAcademyHub } from "@/lib/academy-service";
import { ensureAcademyModulesSeed, ensureAcademyProModulesSeed } from "@/lib/academy-modules";
import type { Locale } from "@/i18n/locale";

/** Edition-scoped learner snapshot for the IA mentor (P3). */
export async function buildMentorLearnerContext(args: {
  userId: string;
  editionSlug: string;
  programSlug?: string;
  locale: Locale;
}): Promise<{
  journey: AcademyJourneySnapshot;
  mentor: AcademyMentorLearnerContext;
  recentVerbs: string[];
}> {
  await ensureAcademyModulesSeed();
  await ensureAcademyProModulesSeed();

  const hub = await getAcademyHub({
    userId: args.userId,
    locale: args.locale,
    viewerRole: "learner",
  });

  const editionId = await resolveEditionIdBySlug({
    editionSlug: args.editionSlug,
    programSlug: args.programSlug,
  });

  const db = getDb();
  let programSlug = args.programSlug ?? "";
  let programLevel = "foundation";
  let priceUsdt: string | null = null;
  let editionTitle = args.editionSlug;

  if (editionId) {
    const [row] = await db
      .select({
        titleFr: academyEditions.titleFr,
        titleEn: academyEditions.titleEn,
        programSlug: academyPrograms.slug,
        programLevel: academyPrograms.level,
        priceUsdt: academyPrograms.priceUsdt,
      })
      .from(academyEditions)
      .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
      .where(eq(academyEditions.id, editionId))
      .limit(1);
    if (row) {
      programSlug = row.programSlug;
      programLevel = row.programLevel;
      priceUsdt = row.priceUsdt?.toString() ?? null;
      editionTitle = args.locale === "fr" ? row.titleFr : row.titleEn;
    }

    const modRows = await db
      .select({
        id: academyModules.id,
        slug: academyModules.slug,
        titleFr: academyModules.titleFr,
        titleEn: academyModules.titleEn,
        unlockAfterSlug: academyModules.unlockAfterSlug,
      })
      .from(academyModules)
      .where(eq(academyModules.editionId, editionId))
      .orderBy(asc(academyModules.sortOrder));

    const progress = await db
      .select({ moduleId: academyModuleProgress.moduleId })
      .from(academyModuleProgress)
      .where(eq(academyModuleProgress.userId, args.userId));

    const doneIds = new Set(progress.map((p) => p.moduleId));
    const doneSlug = new Set(
      modRows.filter((m) => doneIds.has(m.id)).map((m) => m.slug),
    );

    const modulesTotal = modRows.length;
    const modulesCompleted = modRows.filter((m) => doneSlug.has(m.slug)).length;
    const pendingModuleTitles = modRows
      .filter(
        (m) =>
          !doneSlug.has(m.slug) &&
          (!m.unlockAfterSlug || doneSlug.has(m.unlockAfterSlug)),
      )
      .slice(0, 3)
      .map((m) => (args.locale === "fr" ? m.titleFr : m.titleEn));

    const recentRows = await db
      .select({ verb: academyLearningEvents.verb })
      .from(academyLearningEvents)
      .where(
        and(
          eq(academyLearningEvents.userId, args.userId),
          eq(academyLearningEvents.editionId, editionId),
        ),
      )
      .orderBy(desc(academyLearningEvents.createdAt))
      .limit(8);
    const recentVerbs = [...new Set(recentRows.map((r) => r.verb))].slice(0, 5);

    const mentor: AcademyMentorLearnerContext = {
      editionSlug: args.editionSlug,
      programSlug,
      programLevel,
      priceUsdt,
      modulesCompleted,
      modulesTotal,
      pendingModuleTitles,
      nextKind: hub.journey.nextKind,
      nextModuleSlug: hub.journey.nextModuleSlug,
    };

    return { journey: hub.journey, mentor, recentVerbs };
  }

  const recentRows = await db
    .select({ verb: academyLearningEvents.verb })
    .from(academyLearningEvents)
    .where(eq(academyLearningEvents.userId, args.userId))
    .orderBy(desc(academyLearningEvents.createdAt))
    .limit(6);
  const recentVerbs = [...new Set(recentRows.map((r) => r.verb))].slice(0, 4);

  return {
    journey: hub.journey,
    mentor: {
      editionSlug: args.editionSlug,
      programSlug,
      programLevel,
      priceUsdt,
      modulesCompleted: hub.journey.stats.modulesCompleted,
      modulesTotal: hub.journey.stats.modulesTotal,
      pendingModuleTitles: [],
      nextKind: hub.journey.nextKind,
      nextModuleSlug: hub.journey.nextModuleSlug,
    },
    recentVerbs,
  };
}
