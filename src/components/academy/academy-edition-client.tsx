"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { AcademyTopicPath } from "@/components/academy/academy-topic-path";
import { AcademyIcon } from "@/components/academy/academy-icon";
import { AcademyCohortChat } from "@/components/academy/academy-cohort-chat";
import { AcademyTutorPanel } from "@/components/academy/academy-tutor-panel";
import { ACADEMY_QUIZ_FUNDAMENTALS } from "@/lib/academy-config";
import { academyCls } from "@/components/academy/academy-ui";

type Detail = {
  program: { topics: string[] };
  edition: {
    slug: string;
    programSlug: string;
    title: string;
    enrolled: boolean;
    tutorEnabled: boolean;
  };
  sessions: {
    id: string;
    slug: string;
    title: string;
    startsAt: string;
    checkedIn: boolean;
    canCheckIn: boolean;
    liveJoinUrl: string;
    isLiveNow: boolean;
    livePhase: string;
    hasReplay: boolean;
    replayUrl: string | null;
  }[];
  quizzes: { slug: string; title: string; passed: boolean; attemptsUsed: number; maxAttempts: number }[];
};

export function AcademyEditionClient({
  editionSlug,
  programSlug,
}: {
  editionSlug: string;
  programSlug: string;
}) {
  const { t } = useI18n();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [bpFlash, setBpFlash] = useState<number | null>(null);

  const load = useCallback(async () => {
    const q = new URLSearchParams({ program: programSlug });
    const res = await fetchWithDeadline(
      `/api/academy/editions/${editionSlug}?${q}`,
      { credentials: "include", cache: "no-store" },
      20_000,
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok) setDetail(j as Detail);
  }, [editionSlug, programSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#academy-tutor") return;
    const el = document.getElementById("academy-tutor");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [detail?.edition.enrolled]);

  async function trackReplay(sessionId: string) {
    try {
      await fetchWithDeadline(
        "/api/academy/replay",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sessionId }),
        },
        10_000,
      );
    } catch {
      /* analytics best-effort */
    }
  }

  async function checkIn(sessionId: string) {
    setChecking(sessionId);
    try {
      const res = await fetchWithDeadline(
        "/api/academy/attendance",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sessionId }),
        },
        15_000,
      );
      const j = await res.json().catch(() => ({}));
      if (res.ok && typeof j.grantedBp === "number" && j.grantedBp > 0) {
        setBpFlash(j.grantedBp);
        setTimeout(() => setBpFlash(null), 4000);
      }
      await load();
    } finally {
      setChecking(null);
    }
  }

  if (!detail) {
    return <p className="text-sm text-[color:var(--fd-muted)]">…</p>;
  }

  const quiz = detail.quizzes.find((q) => q.slug === ACADEMY_QUIZ_FUNDAMENTALS);

  return (
    <div className={`space-y-4 pb-6 ${academyCls.root}`}>
      <Link
        href="/app/academy"
        className="text-sm font-semibold text-[color:var(--fd-primary)]"
      >
        ← {t("academy_title")}
      </Link>
      <h1 className="text-xl font-extrabold text-[color:var(--fd-text)]">
        {detail.edition.title}
      </h1>

      {detail.edition.enrolled && detail.program.topics?.length ? (
        <AcademyTopicPath
          topics={detail.program.topics}
          editionSlug={editionSlug}
          programSlug={programSlug}
        />
      ) : null}

      {bpFlash != null ? (
        <p className="rounded-xl bg-[#e8f3ee] px-3 py-2 text-sm font-bold text-[#305f33]">
          +{bpFlash} BP
        </p>
      ) : null}

      <section>
        <div className="flex items-center gap-2">
          <img src="/academy/event-live.svg" alt="" className="h-8 w-8" />
          <h2 className="text-sm font-bold">{t("academy_events")}</h2>
        </div>
        <ul className="mt-2 space-y-2">
          {detail.sessions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-[color:var(--fd-border)] bg-white p-3"
            >
              <p className="font-semibold text-[color:var(--fd-text)]">{s.title}</p>
              <p className="mt-0.5 text-xs text-[color:var(--fd-muted)]">
                {new Date(s.startsAt).toLocaleString()}
              </p>
              {s.isLiveNow ? (
                <div className="mt-2 space-y-1.5">
                  <Link
                    href={`/app/academy/${editionSlug}/event/${s.slug}?program=${encodeURIComponent(programSlug)}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#305f33] px-3 py-2.5 text-sm font-extrabold text-white"
                  >
                    <AcademyIcon name="live" className="h-4 w-4 !text-white" />
                    McBuleli Live →
                  </Link>
                  {s.livePhase === "setup" ? (
                    <p className="text-[10px] text-[color:var(--fd-muted)]">
                      {t("academy_live_phase_setup_short")}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {s.checkedIn ? (
                <p className="mt-2 text-xs font-bold text-[color:var(--fd-primary)]">
                  ✓ {t("academy_checked_in")}
                </p>
              ) : s.canCheckIn ? (
                <button
                  type="button"
                  disabled={checking === s.id}
                  onClick={() => void checkIn(s.id)}
                  className="mt-2 w-full rounded-lg bg-[color:var(--fd-primary)] px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  {t("academy_check_in")}
                </button>
              ) : (
                <p className="mt-2 text-xs text-[color:var(--fd-muted)]">
                  {t("academy_checkin_closed")}
                </p>
              )}
              {s.hasReplay && s.replayUrl ? (
                <a
                  href={s.replayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => void trackReplay(s.id)}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-[color:var(--fd-border)] bg-[#f8faf8] px-3 py-2 text-sm font-bold text-[color:var(--fd-primary)]"
                >
                  {t("academy_watch_replay")} ↗
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {detail.edition.enrolled ? (
        <>
          <AcademyTutorPanel
            editionSlug={editionSlug}
            programSlug={programSlug}
            enabled={detail.edition.tutorEnabled}
          />
          <AcademyCohortChat editionSlug={editionSlug} programSlug={programSlug} />
        </>
      ) : null}

      {quiz && detail.edition.enrolled ? (
        <section>
          <h2 className="text-sm font-bold">{t("academy_quiz")}</h2>
          <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
            {quiz.title} · {quiz.attemptsUsed}/{quiz.maxAttempts}
          </p>
          <Link
            href={`/app/academy/quiz/${quiz.slug}?edition=${editionSlug}`}
            className="mt-2 inline-flex rounded-xl border border-[color:var(--fd-primary)] px-4 py-2.5 text-sm font-bold text-[color:var(--fd-primary)]"
          >
            {quiz.passed ? "✓ " : ""}
            {t("academy_quiz_start")} →
          </Link>
        </section>
      ) : null}
    </div>
  );
}
