"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/i18n/messages";
import {
  AcademyJourneyProgress,
  journeyContinueHref,
  journeyNextStepLabel,
} from "@/components/academy/academy-journey-progress";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import {
  ACADEMY_EDITION_JUNE_2026,
  ACADEMY_PROGRAM_LAUNCH,
} from "@/lib/academy-config";
import type { AcademyJourneySnapshot } from "@/lib/academy-journey";
import { AcademyVisualHero } from "@/components/academy/academy-visual-hero";
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
  programs: { slug: string; title: string; level: string; priceUsdt: string | null }[];
  editions: {
    id: string;
    slug: string;
    programSlug: string;
    title: string;
    enrolled: boolean;
    startsAt: string | null;
  }[];
  credentials: {
    id: string;
    title: string;
    verifyCode: string;
    revoked: boolean;
  }[];
};

const ECOSYSTEM_LINKS = [
  { href: "/app/wallet", labelKey: "academy_eco_wallet" as const, icon: "💳" },
  { href: "/app/p2p", labelKey: "academy_eco_p2p" as const, icon: "⇄" },
  { href: "/app/academy", labelKey: "academy_eco_ia" as const, icon: "✨" },
] as const;

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

  const isStaff = hub?.viewer === "staff";
  const showFormationEnroll =
    hub?.formationLead.registeredOnFormation &&
    !hub?.formationLead.enrolledInLaunch &&
    launchEdition &&
    !launchEdition.enrolled;

  const continueHref = hub ? journeyContinueHref(hub.journey) : "/app/academy";
  const nextLive = hub?.upcomingSessions[0];

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
        <section className="rounded-2xl border-2 border-amber-600/30 bg-amber-50 p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
            {t("academy_staff_badge")}
          </p>
          <p className="mt-1 text-xs text-amber-950">{t("academy_staff_hint")}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href="/admin/academy"
              className="inline-flex justify-center rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white"
            >
              {t("academy_staff_ops")} →
            </Link>
            <Link
              href="/admin/training-registrations"
              className="inline-flex justify-center rounded-xl border border-amber-800/30 bg-white px-4 py-2.5 text-sm font-bold text-amber-950"
            >
              {t("academy_staff_formation_list")} →
            </Link>
            <Link
              href="/app/profile/ops"
              className="inline-flex justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-stone-700"
            >
              {t("academy_staff_ops_hub")} →
            </Link>
          </div>
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
          <AcademyVisualHero
            levelKey={hub.journey.levelKey}
            alt={t("academy_journey_your_level")}
          />
          <AcademyJourneyProgress
            displayName={hub.displayName ?? hub.formationLead.fullName}
            journey={hub.journey}
          />

          <section className="rounded-2xl border-2 border-[#305f33] bg-[#305f33] p-4 text-white shadow-md">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#c5e8d0]">
              {t("academy_journey_continue")}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#e8f3ee]">
              {journeyNextStepLabel(t, hub.journey, nextLive?.title)}
            </p>
            {showFormationEnroll ? (
              <button
                type="button"
                disabled={enrolling}
                onClick={() =>
                  launchEdition &&
                  void enroll(launchEdition.slug, launchEdition.programSlug)
                }
                className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-[#305f33] disabled:opacity-60"
              >
                {t("academy_formation_activate")}
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

          {hub.upcomingSessions.length > 0 ? (
            <section>
              <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
                {t("academy_journey_upcoming_lives")}
              </h2>
              <ul className="mt-2 space-y-2">
                {hub.upcomingSessions.map((s) => {
                  const q = `?program=${encodeURIComponent(s.programSlug)}`;
                  const href = s.isLiveNow
                    ? `/app/academy/${s.editionSlug}/live/${s.sessionSlug}${q}`
                    : `/app/academy/${s.editionSlug}${q}`;
                  return (
                    <li key={`${s.editionSlug}-${s.sessionSlug}`}>
                      <Link
                        href={href}
                        className="flex items-center gap-3 rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-3 shadow-sm"
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                            s.isLiveNow ? "bg-rose-100" : "bg-[#e8f3ee]"
                          }`}
                          aria-hidden
                        >
                          {s.isLiveNow ? "●" : "📅"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[color:var(--fd-text)]">
                            {s.title}
                          </p>
                          <p className="text-[10px] text-[color:var(--fd-muted)]">
                            {s.isLiveNow
                              ? "LIVE"
                              : new Date(s.startsAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-[color:var(--fd-primary)]" aria-hidden>
                          →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
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
              {ECOSYSTEM_LINKS.map(({ href, labelKey, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center rounded-xl border border-[color:var(--fd-border)] bg-white px-2 py-3 text-center shadow-sm active:scale-[0.98]"
                >
                  <span className="text-xl" aria-hidden>
                    {icon}
                  </span>
                  <span className="mt-1 text-[10px] font-extrabold text-[color:var(--fd-text)]">
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
      ) : (
        <p className="text-sm text-[color:var(--fd-muted)]">
          {t("academy_staff_hint")}
        </p>
      )}
    </div>
  );
}
