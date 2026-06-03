"use client";

import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/i18n/messages";
import type { AcademyJourneySnapshot } from "@/lib/academy-journey";

const LEVEL_KEYS = [
  "academy_journey_level_explorer",
  "academy_journey_level_crypto_user",
  "academy_journey_level_ecosystem",
  "academy_journey_level_trading",
  "academy_journey_level_bots",
  "academy_journey_level_advanced",
] as const;

const LEVEL_MAP: Record<AcademyJourneySnapshot["levelKey"], (typeof LEVEL_KEYS)[number]> = {
  explorer: "academy_journey_level_explorer",
  crypto_user: "academy_journey_level_crypto_user",
  ecosystem: "academy_journey_level_ecosystem",
  trading: "academy_journey_level_trading",
  bots: "academy_journey_level_bots",
  advanced: "academy_journey_level_advanced",
};

export function AcademyJourneyProgress({
  displayName,
  journey,
}: {
  displayName: string | null;
  journey: AcademyJourneySnapshot;
}) {
  const { t } = useI18n();
  const pct = journey.progressPercent;
  const filled = Math.round(pct / 10);

  return (
    <section className="rounded-2xl border border-[#305f33]/20 bg-gradient-to-br from-[#e8f3ee] via-white to-white p-4 shadow-sm">
      <p className="text-sm font-bold text-[color:var(--fd-text)]">
        {displayName
          ? interpolate(t("academy_journey_hello_named"), { name: displayName })
          : t("academy_journey_hello")}
      </p>
      <p className="mt-2 text-[10px] font-extrabold uppercase tracking-wider text-[#305f33]">
        {t("academy_journey_your_level")}
      </p>
      <p className="text-base font-black text-[color:var(--fd-text)]">
        {t(LEVEL_MAP[journey.levelKey])}
      </p>
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] font-bold text-[color:var(--fd-muted)]">
          <span>{t("academy_journey_progress")}</span>
          <span>{pct}%</span>
        </div>
        <div
          className="mt-1 flex gap-0.5"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-sm ${
                i < filled ? "bg-[#305f33]" : "bg-[#305f33]/15"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-semibold text-[color:var(--fd-muted)]">
        <span>
          {journey.stats.cohortsEnrolled} {t("academy_journey_stat_cohorts")}
        </span>
        <span>
          {journey.stats.livesAttended} {t("academy_journey_stat_lives")}
        </span>
        <span>
          {journey.stats.quizzesPassed} {t("academy_journey_stat_quizzes")}
        </span>
        <span>
          {journey.stats.badges} {t("academy_journey_stat_badges")}
        </span>
        {journey.stats.modulesTotal > 0 ? (
          <span>
            {journey.stats.modulesCompleted}/{journey.stats.modulesTotal}{" "}
            {t("academy_journey_stat_modules")}
          </span>
        ) : null}
      </div>
    </section>
  );
}

export function journeyContinueHref(journey: AcademyJourneySnapshot): string {
  const {
    nextKind,
    nextEditionSlug,
    nextProgramSlug,
    nextSessionSlug,
    nextQuizSlug,
    nextModuleSlug,
  } = journey;
  const q = nextProgramSlug
    ? `?program=${encodeURIComponent(nextProgramSlug)}`
    : "";
  switch (nextKind) {
    case "module":
      return nextEditionSlug && nextModuleSlug
        ? `/app/academy/${nextEditionSlug}/module/${nextModuleSlug}${q}`
        : "/app/academy";
    case "enroll_pro":
      return "/app/academy#pro-cohort";
    case "formation_register":
      return "/formation";
    case "activate_cohort":
    case "enroll_cohort":
    case "enter_cohort":
      return nextEditionSlug
        ? `/app/academy/${nextEditionSlug}${q}`
        : "/app/academy";
    case "live_session":
      return nextEditionSlug && nextSessionSlug
        ? `/app/academy/${nextEditionSlug}/live/${nextSessionSlug}${q}`
        : nextEditionSlug
          ? `/app/academy/${nextEditionSlug}${q}`
          : "/app/academy";
    case "quiz":
      return nextQuizSlug && nextEditionSlug
        ? `/app/academy/quiz/${nextQuizSlug}?edition=${encodeURIComponent(nextEditionSlug)}`
        : "/app/academy";
    default:
      return "/app/wallet";
  }
}

export function journeyNextStepLabel(
  t: (key: keyof import("@/i18n/messages").Messages) => string,
  journey: AcademyJourneySnapshot,
  upcomingTitle?: string,
): string {
  switch (journey.nextKind) {
    case "formation_register":
      return t("academy_journey_next_formation");
    case "activate_cohort":
      return t("academy_journey_next_activate");
    case "enroll_cohort":
      return t("academy_journey_next_enroll");
    case "live_session":
      return upcomingTitle
        ? `${t("academy_journey_next_live")}: ${upcomingTitle}`
        : t("academy_journey_next_live");
    case "quiz":
      return t("academy_journey_next_quiz");
    case "module":
      return t("academy_journey_next_module");
    case "enroll_pro":
      return t("academy_journey_next_pro");
    case "enter_cohort":
      return t("academy_journey_next_cohort");
    default:
      return t("academy_journey_next_ecosystem");
  }
}
