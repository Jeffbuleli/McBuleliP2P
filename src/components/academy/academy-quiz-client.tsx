"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { academyCls } from "@/components/academy/academy-ui";
import { interpolate } from "@/i18n/messages";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";

type QuizPayload = {
  quiz: {
    id: string;
    slug: string;
    title: string;
    passPercent: number;
    maxAttempts: number;
    attemptsUsed: number;
  };
  questions: { id: string; prompt: string; options: string[] }[];
};

export function AcademyQuizClient({
  quizSlug,
  editionSlug,
}: {
  quizSlug: string;
  editionSlug: string;
}) {
  const { t } = useI18n();
  const [data, setData] = useState<QuizPayload | null>(null);
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    scorePercent: number;
    passed: boolean;
    grantedBp: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = new URLSearchParams({ edition: editionSlug });
    const res = await fetchWithDeadline(
      `/api/academy/quiz/${quizSlug}?${q}`,
      { credentials: "include", cache: "no-store" },
      20_000,
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok) setData(j as QuizPayload);
  }, [quizSlug, editionSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    if (!data) return;
    const unanswered = data.questions.some((q) => choices[q.id] === undefined);
    if (unanswered) {
      setErr(t("academy_quiz_answer_all"));
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const answers = data.questions.map((q) => ({
        questionId: q.id,
        choiceIndex: choices[q.id]!,
      }));
      const res = await fetchWithDeadline(
        `/api/academy/quiz/${quizSlug}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ editionSlug, answers }),
        },
        20_000,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : t("academy_error_load"));
        return;
      }
      setResult({
        scorePercent: j.scorePercent,
        passed: j.passed,
        grantedBp: j.grantedBp ?? 0,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!data) {
    return (
      <p className={`text-sm text-[color:var(--fd-muted)] ${academyCls.root}`}>…</p>
    );
  }

  if (result) {
    return (
      <div className={`space-y-4 pb-6 ${academyCls.root}`}>
        <p className="text-lg font-extrabold text-[color:var(--fd-text)]">
          {interpolate(t("academy_quiz_score"), {
            score: String(result.scorePercent),
          })}
        </p>
        <p className="text-sm text-[color:var(--fd-text)]">
          {result.passed
            ? interpolate(t("academy_quiz_passed"), {
                bp: String(result.grantedBp),
              })
            : t("academy_quiz_failed")}
        </p>
        <Link
          href={`/app/academy/${editionSlug}`}
          className="text-sm font-semibold text-[color:var(--fd-primary)]"
        >
          ← {t("academy_sessions")}
        </Link>
      </div>
    );
  }

  return (
    <div className={`space-y-4 pb-6 ${academyCls.root}`}>
      <Link
        href={`/app/academy/${editionSlug}`}
        className="text-sm font-semibold text-[color:var(--fd-primary)]"
      >
        ←
      </Link>
      <h1 className="text-lg font-extrabold text-[color:var(--fd-text)]">
        {data.quiz.title}
      </h1>
      <p className="text-xs text-[color:var(--fd-muted)]">
        {data.quiz.attemptsUsed}/{data.quiz.maxAttempts} · {data.quiz.passPercent}%
      </p>
      {err ? <p className="text-sm text-rose-700">{err}</p> : null}
      <ol className="space-y-4">
        {data.questions.map((q, i) => (
          <li key={q.id} className={academyCls.card}>
            <p className="text-sm font-bold text-[color:var(--fd-text)]">
              {i + 1}. {q.prompt}
            </p>
            <ul className="mt-2 space-y-1.5">
              {q.options.map((opt, idx) => (
                <li key={idx}>
                  <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[color:var(--fd-text)]">
                    <input
                      type="radio"
                      name={q.id}
                      checked={choices[q.id] === idx}
                      onChange={() =>
                        setChoices((prev) => ({ ...prev, [q.id]: idx }))
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#305f33]"
                    />
                    <span className="leading-snug">{opt}</span>
                  </label>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <button
        type="button"
        disabled={submitting}
        onClick={() => void submit()}
        className="w-full rounded-xl bg-[color:var(--fd-primary)] py-3 text-sm font-extrabold text-white disabled:opacity-60"
      >
        {t("academy_quiz_submit")}
      </button>
    </div>
  );
}
