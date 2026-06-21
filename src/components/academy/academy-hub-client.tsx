"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/i18n/messages";
import {
  AcademyJourneyProgress,
  journeyContinueHref,
  journeyNextStepLabel,
  journeyShouldEnroll,
} from "@/components/academy/academy-journey-progress";
import { AcademyTopicPath } from "@/components/academy/academy-topic-path";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import {
  ACADEMY_EDITION_JUNE_2026,
  ACADEMY_EDITION_PRO_Q3,
  ACADEMY_PROGRAM_LAUNCH,
  ACADEMY_PROGRAM_PRO,
  ACADEMY_QUIZ_FUNDAMENTALS,
} from "@/lib/academy-config";
import type { AcademyJourneySnapshot } from "@/lib/academy-journey";
import { AcademyIcon, type AcademyIconName } from "@/components/academy/academy-icon";
import { formatAcademyUsdtPrice } from "@/lib/academy-format";
import { AcademyStaffHubPanel } from "@/components/academy/academy-staff-hub-panel";
import { academyCls } from "@/components/academy/academy-ui";

type FormationLead = {
  registeredOnFormation: boolean;
  enrolledInLaunch: boolean;
  fullName: string | null;
};

type UpcomingSession = {
  editionSlug: string;
  programSlug: string;
  sessionSlug: string;
  title: string;
  startsAt: string;
  isLiveNow: boolean;
};

type Hub = {
  viewer: "learner" | "staff";
  displayName: string | null;
  formationLead: FormationLead;
  journey: AcademyJourneySnapshot;
  upcomingSessions: UpcomingSession[];
  quizSummary: {
    editionSlug: string;
    programSlug: string;
    slug: string;
    title: string;
    available: boolean;
    passed: boolean;
    attemptsUsed: number;
    maxAttempts: number;
  } | null;
  programs: { slug: string; title: string; level: string; priceUsdt: string | null; topics: string[] }[];
  editions: {
    id: string;
    slug: string;
    programSlug: string;
    title: string;
    enrolled: boolean;
    startsAt: string | null;
    priceUsdt: string | null;
    requiresKyc: boolean;
  }[];
  credentials: {
    id: string;
    title: string;
    verifyCode: string;
    revoked: boolean;
  }[];
};

const ECOSYSTEM_LINKS: {
  href: string;
  labelKey: "academy_eco_wallet" | "academy_eco_p2p" | "academy_eco_ia";
  icon: AcademyIconName;
}[] = [
  { href: "/app/wallet", labelKey: "academy_eco_wallet", icon: "wallet" },
  { href: "/app/p2p", labelKey: "academy_eco_p2p", icon: "p2p" },
  { href: "/app/academy", labelKey: "academy_eco_ia", icon: "tutor" },
];

export function AcademyHubClient() {
  const { t } = useI18n();
  const [hub, setHub] = useState<Hub | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dbPending, setDbPending] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetchWithDeadline(
        "/api/academy/overview",
        { credentials: "include", cache: "no-store" },
        20_000,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 503 && j.error === "academy_db_not_migrated") {
          setDbPending(true);
          setErr(t("academy_db_not_ready"));
        } else {
          setDbPending(false);
          setErr(t("academy_error_load"));
        }
        return;
      }
      setDbPending(false);
      setHub(j as Hub);
    } catch {
      setErr(t("academy_error_load"));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function enroll(editionSlug: string, programSlug: string) {
    setEnrolling(true);
    try {
      const res = await fetchWithDeadline(
        "/api/academy/enroll",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ editionSlug, programSlug }),
        },
        20_000,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = typeof j.error === "string" ? j.error : "";
        if (code === "academy_insufficient_balance") {
          setErr(t("academy_insufficient_balance"));
        } else if (code === "academy_kyc_required") {
          setErr(t("academy_kyc_required"));
        } else {
          setErr(t("academy_error_enroll"));
        }
        return;
      }
      await load();
    } finally {
      setEnrolling(false);
    }
  }

  const launchEdition = hub?.editions.find(
    (e) =>
      e.slug === ACADEMY_EDITION_JUNE_2026 &&
      e.programSlug === ACADEMY_PROGRAM_LAUNCH,
  );

  const proEdition = hub?.editions.find(
    (e) =>
      e.slug === ACADEMY_EDITION_PRO_Q3 && e.programSlug === ACADEMY_PROGRAM_PRO,
  );

  const isStaff = hub?.viewer === "staff";
  const showFormationEnroll =
    hub?.formationLead.registeredOnFormation &&
    !hub?.formationLead.enrolledInLaunch &&
    launchEdition &&
    !launchEdition.enrolled;

  const continueEnrollEdition =
    hub?.editions.find(
      (e) =>
        !e.enrolled &&
        e.slug === hub.journey.nextEditionSlug &&
        e.programSlug === hub.journey.nextProgramSlug,
    ) ?? null;
  const continueHref = hub ? journeyContinueHref(hub.journey) : "/app/academy";
  const showContinueEnroll =
    Boolean(continueEnrollEdition) &&
    (showFormationEnroll ||
      (hub != null && journeyShouldEnroll(hub.journey)));
  const nextLive = hub?.upcomingSessions[0];
  const enrolledEdition =
    hub?.editions.find((e) => e.enrolled) ?? launchEdition ?? null;
  const enrolledProgram = enrolledEdition
    ? hub?.programs.find((p) => p.slug === enrolledEdition.programSlug)
    : null;

  const tutorEdition = enrolledEdition;
  const ecosystemLinks = ECOSYSTEM_LINKS.map((link) => {
    if (link.labelKey !== "academy_eco_ia") return link;
    if (!tutorEdition) {
      return { ...link, href: "/formation" };
    }
    const q = `?program=${encodeURIComponent(tutorEdition.programSlug)}`;
    return {
      ...link,
      href: `/app/academy/${tutorEdition.slug}${q}#academy-tutor`,
    };
  });

  return (
    <div className={`space-y-4 pb-6 ${academyCls.root}`}>
      <header>
        <h1 className="text-xl font-extrabold text-[color:var(--fd-text)]">
          {isStaff ? t("academy_title_staff") : t("academy_title")}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--fd-muted)]">
          {isStaff ? t("academy_subtitle_staff") : t("academy_journey_subtitle")}
        </p>
      </header>

      {isStaff ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <img src="/academy/event-live.svg" alt="" className="h-9 w-9" />
            <p className="text-xs font-bold text-[#305f33]">{t("academy_staff_badge")}</p>
          </div>
          <AcademyStaffHubPanel />
        </section>
      ) : null}

      {err ? (
        <div
          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
            dbPending
              ? "bg-amber-50 text-amber-900"
              : "bg-rose-50 text-rose-800"
          }`}
        >
          <p>{err}</p>
          {dbPending ? (
            <button
              type="button"
              onClick={() => void load()}
              className="mt-2 text-xs font-extrabold underline"
            >
              {t("academy_retry")}
            </button>
          ) : null}
        </div>
      ) : null}

      {!hub ? (
        <div className="space-y-3">
          <div className="h-28 animate-pulse rounded-2xl bg-[#e8f3ee]" />
          <div className="h-12 animate-pulse rounded-xl bg-[color:var(--fd-border)]/30" />
        </div>
      ) : !isStaff ? (
        <>
          <AcademyJourneyProgress
            displayName={hub.displayName ?? hub.formationLead.fullName}
            journey={hub.journey}
          />

          {enrolledEdition && enrolledProgram?.topics?.length ? (
            <AcademyTopicPath
              topics={enrolledProgram.topics}
              editionSlug={enrolledEdition.slug}
              programSlug={enrolledEdition.programSlug}
            />
          ) : null}

          {hub.quizSummary?.available ? (
            <section className="rounded-xl border border-[color:var(--fd-border)] bg-white p-3">
              <div className="flex items-center gap-2">
                <AcademyIcon name="tutor" className="h-5 w-5" />
                <h2 className="text-sm font-bold">{t("academy_quiz")}</h2>
              </div>
              <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
                {hub.quizSummary.title} · {hub.quizSummary.attemptsUsed}/
                {hub.quizSummary.maxAttempts}
              </p>
              <Link
                href={`/app/academy/quiz/${hub.quizSummary.slug}?edition=${hub.quizSummary.editionSlug}`}
                className="mt-2 inline-flex rounded-xl bg-[#305f33] px-4 py-2.5 text-sm font-bold text-white"
              >
                {hub.quizSummary.passed ? "✓ " : ""}
                {t("academy_quiz_start")} →
              </Link>
            </section>
          ) : null}

          <section className="rounded-2xl border-2 border-[#305f33] bg-[#305f33] p-4 text-white shadow-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#c5e8d0]">
              {t("academy_journey_continue")}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#e8f3ee]">
              {journeyNextStepLabel(t, hub.journey, nextLive?.title)}
            </p>
            {showContinueEnroll && continueEnrollEdition ? (
              <button
                type="button"
                disabled={enrolling}
                onClick={() =>
                  void enroll(
                    continueEnrollEdition.slug,
                    continueEnrollEdition.programSlug,
                  )
                }
                className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-[#305f33] disabled:opacity-60"
              >
                {showFormationEnroll
                  ? t("academy_formation_activate")
                  : t("academy_enroll")}
              </button>
            ) : (
              <Link
                href={continueHref}
                className="mt-3 flex w-full justify-center rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-[#305f33]"
              >
                {t("academy_journey_continue_btn")} →
              </Link>
            )}
          </section>

          <Link
            href="/app/academy/studio"
            className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-[#305f33]/40 bg-white px-4 py-3 shadow-sm"
          >
            <img src="/academy/event-live.svg" alt="" className="h-11 w-11" />
            <span className="flex-1 text-sm font-extrabold text-[#305f33]">
              {t("academy_live_studio_hub")}
            </span>
            <span aria-hidden>→</span>
          </Link>

          {nextLive ? (
            <section className="rounded-xl border border-[color:var(--fd-border)] bg-white p-3">
              <div className="flex items-center gap-2">
                <AcademyIcon name={nextLive.isLiveNow ? "live" : "calendar"} className="h-5 w-5" />
                <h2 className="text-sm font-bold">{t("academy_events")}</h2>
              </div>
              <p className="mt-1 text-sm font-semibold">{nextLive.title}</p>
              <p className="text-[10px] text-[color:var(--fd-muted)]">
                {nextLive.isLiveNow
                  ? "LIVE"
                  : new Date(nextLive.startsAt).toLocaleString()}
              </p>
              <Link
                href={
                  nextLive.isLiveNow
                    ? `/app/academy/${nextLive.editionSlug}/event/${nextLive.sessionSlug}?program=${encodeURIComponent(nextLive.programSlug)}`
                    : `/app/academy/${nextLive.editionSlug}?program=${encodeURIComponent(nextLive.programSlug)}`
                }
                className="mt-2 inline-flex w-full justify-center rounded-xl bg-[#305f33] py-2.5 text-sm font-extrabold text-white"
              >
                {nextLive.isLiveNow ? "McBuleli Live →" : t("academy_journey_continue_btn")}
              </Link>
            </section>
          ) : null}

          <section>
            <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
              {t("academy_journey_ecosystem")}
            </h2>
            <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">
              {t("academy_journey_ecosystem_hint")}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {ecosystemLinks.map(({ href, labelKey, icon }) => (
                <Link
                  key={labelKey}
                  href={href}
                  className="flex flex-col items-center rounded-xl border border-[color:var(--fd-border)] bg-white px-2 py-3 text-center shadow-sm active:scale-[0.98]"
                >
                  <AcademyIcon name={icon} className="h-6 w-6" />
                  <span className="mt-1.5 text-[10px] font-extrabold text-[color:var(--fd-text)]">
                    {t(labelKey)}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {showFormationEnroll ? (
            <section className="rounded-2xl border border-[color:var(--fd-primary)]/40 bg-[#e8f3ee] p-4">
              <p className="text-sm font-bold text-[#305f33]">
                {t("academy_formation_linked_title")}
              </p>
              <p className="mt-1 text-xs text-[#1a2e1c]">
                {hub.formationLead.fullName
                  ? interpolate(t("academy_formation_linked_body_named"), {
                      name: hub.formationLead.fullName,
                    })
                  : t("academy_formation_linked_body")}
              </p>
            </section>
          ) : null}

          {proEdition && !proEdition.enrolled ? (
            <section
              id="pro-cohort"
              className="rounded-2xl border-2 border-[#305f33]/25 bg-white p-4 shadow-sm"
            >
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#305f33]">
                {t("academy_pro_badge")}
              </p>
              <h2 className="mt-1 text-base font-black text-[color:var(--fd-text)]">
                {proEdition.title}
              </h2>
              <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
                {t("academy_pro_summary")}
              </p>
              <p className="mt-2 text-sm font-bold text-[#305f33]">
                {formatAcademyUsdtPrice(proEdition.priceUsdt)} USDT ·{" "}
                {t("academy_pro_kyc_hint")}
              </p>
              <button
                type="button"
                disabled={enrolling}
                onClick={() =>
                  void enroll(proEdition.slug, proEdition.programSlug)
                }
                className="mt-3 w-full rounded-xl bg-[#305f33] py-3 text-sm font-extrabold text-white disabled:opacity-60"
              >
                {t("academy_pro_enroll_btn")}
              </button>
            </section>
          ) : null}

          {hub.editions.some((e) => e.enrolled) ? (
            <section>
              <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
                {t("academy_my_cohorts")}
              </h2>
              <ul className="mt-2 space-y-2">
                {hub.editions
                  .filter((e) => e.enrolled)
                  .map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/app/academy/${e.slug}?program=${encodeURIComponent(e.programSlug)}`}
                        className="flex items-center justify-between rounded-xl border border-[color:var(--fd-border)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--fd-text)] shadow-sm"
                      >
                        {e.title}
                        <span aria-hidden>→</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ) : (
            <section className="rounded-xl border border-dashed border-[color:var(--fd-border)] bg-white p-4 text-center">
              <p className="text-sm font-semibold text-[color:var(--fd-text)]">
                {t("academy_no_cohort_yet")}
              </p>
              <Link
                href="/formation"
                className="mt-3 inline-flex text-sm font-bold text-[color:var(--fd-primary)] underline"
              >
                {t("academy_go_formation")} →
              </Link>
            </section>
          )}

          {hub.credentials.length > 0 ? (
            <section>
              <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
                {t("academy_badges")}
              </h2>
              <ul className="mt-2 space-y-2">
                {hub.credentials.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-[color:var(--fd-border)] bg-white px-4 py-3"
                  >
                    <p className="text-sm font-bold text-[color:var(--fd-text)]">
                      {c.title}
                    </p>
                    <Link
                      href={`/verify/${c.verifyCode}`}
                      className="mt-1 text-xs font-semibold text-[color:var(--fd-primary)]"
                    >
                      {t("academy_verify_link")} →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
