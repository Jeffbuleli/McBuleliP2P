import type { AcademyLevel } from "@/lib/academy-config";
import {
  ACADEMY_EDITION_JUNE_2026,
  ACADEMY_PROGRAM_LAUNCH,
} from "@/lib/academy-config";

export type AcademyJourneyLevelKey =
  | "explorer"
  | "crypto_user"
  | "ecosystem"
  | "trading"
  | "bots"
  | "advanced";

export type AcademyJourneyNextKind =
  | "formation_register"
  | "activate_cohort"
  | "enroll_cohort"
  | "enter_cohort"
  | "live_session"
  | "quiz"
  | "explore_ecosystem"
  | "module"
  | "enroll_pro";

export type AcademyJourneySnapshot = {
  levelKey: AcademyJourneyLevelKey;
  progressPercent: number;
  nextKind: AcademyJourneyNextKind;
  nextEditionSlug: string | null;
  nextProgramSlug: string | null;
  nextSessionSlug: string | null;
  nextQuizSlug: string | null;
  nextModuleSlug: string | null;
  stats: {
    cohortsEnrolled: number;
    livesAttended: number;
    quizzesPassed: number;
    badges: number;
    modulesCompleted: number;
    modulesTotal: number;
  };
};

export type JourneyHubInput = {
  formationLead: {
    registeredOnFormation: boolean;
    enrolledInLaunch: boolean;
  };
  editions: {
    slug: string;
    programSlug: string;
    title: string;
    enrolled: boolean;
    startsAt: string | null;
  }[];
  programs: { slug: string; level: string }[];
  credentialsCount: number;
  livesAttended: number;
  quizzesPassed: number;
  upcomingSessions: {
    editionSlug: string;
    programSlug: string;
    sessionSlug: string;
    title: string;
    startsAt: string;
    isLiveNow: boolean;
  }[];
  quizFundamentalsAvailable: boolean;
  quizFundamentalsPassed: boolean;
  modulesCompleted: number;
  modulesTotal: number;
  modules: { slug: string; unlocked: boolean; completed: boolean }[];
  proEdition: {
    editionSlug: string;
    programSlug: string;
    enrolled: boolean;
    open: boolean;
  } | null;
};

const LEVEL_ORDER: AcademyJourneyLevelKey[] = [
  "explorer",
  "crypto_user",
  "ecosystem",
  "trading",
  "bots",
  "advanced",
];

function levelFromProgram(level: string, enrolled: boolean): AcademyJourneyLevelKey {
  const l = level as AcademyLevel;
  if (l === "expert") return "advanced";
  if (l === "pro") return enrolled ? "bots" : "trading";
  if (l === "foundation") return enrolled ? "ecosystem" : "crypto_user";
  return enrolled ? "ecosystem" : "explorer";
}

export function computeAcademyJourney(input: JourneyHubInput): AcademyJourneySnapshot {
  const launch = input.editions.find(
    (e) =>
      e.slug === ACADEMY_EDITION_JUNE_2026 &&
      e.programSlug === ACADEMY_PROGRAM_LAUNCH,
  );
  const launchProgram = input.programs.find((p) => p.slug === ACADEMY_PROGRAM_LAUNCH);
  const proReady =
    input.proEdition?.open &&
    input.proEdition.enrolled === false &&
    launch?.enrolled &&
    (input.modulesCompleted >= 2 ||
      input.quizFundamentalsPassed ||
      input.livesAttended >= 1);
  const cohortsEnrolled = input.editions.filter((e) => e.enrolled).length;
  const badges = input.credentialsCount;

  let progress = 0;
  if (input.formationLead.registeredOnFormation || cohortsEnrolled > 0) {
    progress += 15;
  }
  if (launch?.enrolled) progress += 25;
  if (input.livesAttended >= 1) progress += 20;
  if (input.quizFundamentalsPassed) progress += 20;
  if (input.livesAttended >= 2) progress += 10;
  if (badges >= 1) progress += 10;
  if (input.modulesTotal > 0) {
    progress += Math.min(
      20,
      Math.round((input.modulesCompleted / input.modulesTotal) * 20),
    );
  }
  progress = Math.min(100, progress);

  const enrolledAny = cohortsEnrolled > 0;
  const levelKey = launchProgram
    ? levelFromProgram(launchProgram.level, enrolledAny)
    : enrolledAny
      ? "ecosystem"
      : "explorer";

  const nextLive = input.upcomingSessions[0] ?? null;

  let nextKind: AcademyJourneyNextKind = "explore_ecosystem";
  let nextEditionSlug: string | null = launch?.slug ?? null;
  let nextProgramSlug: string | null = launch?.programSlug ?? ACADEMY_PROGRAM_LAUNCH;
  let nextSessionSlug: string | null = null;
  let nextQuizSlug: string | null = null;
  let nextModuleSlug: string | null = null;

  const nextModule = input.modules.find((m) => m.unlocked && !m.completed);

  if (
    input.formationLead.registeredOnFormation &&
    launch &&
    !launch.enrolled
  ) {
    nextKind = "activate_cohort";
  } else if (!launch?.enrolled && !input.formationLead.registeredOnFormation) {
    nextKind = input.formationLead.registeredOnFormation
      ? "activate_cohort"
      : "formation_register";
    nextEditionSlug = ACADEMY_EDITION_JUNE_2026;
    nextProgramSlug = ACADEMY_PROGRAM_LAUNCH;
  } else if (nextLive?.isLiveNow) {
    nextKind = "live_session";
    nextEditionSlug = nextLive.editionSlug;
    nextProgramSlug = nextLive.programSlug;
    nextSessionSlug = nextLive.sessionSlug;
  } else if (nextLive) {
    nextKind = "live_session";
    nextEditionSlug = nextLive.editionSlug;
    nextProgramSlug = nextLive.programSlug;
    nextSessionSlug = nextLive.sessionSlug;
  } else if (nextModule && launch?.enrolled) {
    nextKind = "module";
    nextEditionSlug = launch.slug;
    nextProgramSlug = launch.programSlug;
    nextModuleSlug = nextModule.slug;
  } else if (
    launch?.enrolled &&
    input.quizFundamentalsAvailable &&
    !input.quizFundamentalsPassed
  ) {
    nextKind = "quiz";
    nextEditionSlug = launch.slug;
    nextProgramSlug = launch.programSlug;
    nextQuizSlug = "fondamentaux";
  } else if (proReady && input.proEdition) {
    nextKind = "enroll_pro";
    nextEditionSlug = input.proEdition.editionSlug;
    nextProgramSlug = input.proEdition.programSlug;
  } else if (launch?.enrolled) {
    nextKind = "enter_cohort";
    nextEditionSlug = launch.slug;
    nextProgramSlug = launch.programSlug;
  } else if (!launch?.enrolled) {
    nextKind = "enroll_cohort";
    nextEditionSlug = ACADEMY_EDITION_JUNE_2026;
    nextProgramSlug = ACADEMY_PROGRAM_LAUNCH;
  }

  return {
    levelKey,
    progressPercent: progress,
    nextKind,
    nextEditionSlug,
    nextProgramSlug,
    nextSessionSlug,
    nextQuizSlug,
    nextModuleSlug,
    stats: {
      cohortsEnrolled,
      livesAttended: input.livesAttended,
      quizzesPassed: input.quizzesPassed,
      badges,
      modulesCompleted: input.modulesCompleted,
      modulesTotal: input.modulesTotal,
    },
  };
}

export function journeyLevelIndex(key: AcademyJourneyLevelKey): number {
  return LEVEL_ORDER.indexOf(key);
}
