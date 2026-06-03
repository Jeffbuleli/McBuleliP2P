"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { ACADEMY_QUIZ_FUNDAMENTALS } from "@/lib/academy-config";

type Detail = {
  edition: { slug: string; programSlug: string; title: string; enrolled: boolean };
  sessions: {
    id: string;
    slug: string;
    title: string;
    startsAt: string;
    checkedIn: boolean;
    canCheckIn: boolean;
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
    <div className="space-y-4 pb-6">
      <Link
        href="/app/academy"
        className="text-sm font-semibold text-[color:var(--fd-primary)]"
      >
        ← {t("academy_title")}
      </Link>
      <h1 className="text-xl font-extrabold text-[color:var(--fd-text)]">
        {detail.edition.title}
      </h1>

      {bpFlash != null ? (
        <p className="rounded-xl bg-[#e8f3ee] px-3 py-2 text-sm font-bold text-[#305f33]">
          +{bpFlash} BP
        </p>
      ) : null}

      <section>
        <h2 className="text-sm font-bold">{t("academy_sessions")}</h2>
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
            </li>
          ))}
        </ul>
      </section>

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
