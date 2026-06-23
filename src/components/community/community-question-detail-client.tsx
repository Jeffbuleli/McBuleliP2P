"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { QuestionDetail } from "@/lib/community/qa-service";

export function CommunityQuestionDetailClient({
  questionId,
}: {
  questionId: string;
}) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [answerBody, setAnswerBody] = useState("");
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bpToast, setBpToast] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch(`/api/community/questions/${questionId}`);
    const j = await res.json();
    if (res.ok) setQuestion(j.question as QuestionDetail);
  };

  useEffect(() => {
    void load();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: { id: string } | null }) => {
        if (d.user?.id) setViewerId(d.user.id);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const submitAnswer = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/community/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: answerBody.trim() }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "failed");
        return;
      }
      setAnswerBody("");
      await load();
      if (j.bpGranted?.granted) {
        setBpToast(`+${j.bpGranted.points} BP`);
        setTimeout(() => setBpToast(null), 3000);
      }
    } finally {
      setBusy(false);
    }
  };

  const vote = async (answerId: string) => {
    await fetch(`/api/community/answers/${answerId}/vote`, { method: "POST" });
    await load();
  };

  const accept = async (answerId: string) => {
    await fetch(`/api/community/questions/${questionId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answerId }),
    });
    await load();
  };

  if (!question) {
    return (
      <div className="community-theme mx-auto max-w-lg px-4 py-8 text-center text-sm text-[#78716c]">
        …
      </div>
    );
  }

  const isAuthor = viewerId === question.author.userId;

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-4 pt-4">
      <Link
        href="/app/community/questions"
        className="text-sm font-semibold text-[#305f33]"
      >
        ← {fr ? "Questions" : "Q&A"}
      </Link>

      <article className="fd-card mt-4 px-4 py-4">
        <h1 className="text-lg font-bold text-[#0c0a09]">{question.title}</h1>
        <p className="mt-1 text-xs text-[#78716c]">
          <Link
            href={`/app/community/u/${question.author.handle}`}
            className="font-semibold text-[#305f33]"
          >
            @{question.author.handle}
          </Link>
        </p>
        <p className="mt-3 whitespace-pre-wrap text-sm text-[#44403c]">
          {question.body}
        </p>
      </article>

      <div className="fd-card mt-4 space-y-3 px-4 py-4">
        <p className="text-sm font-semibold text-[#0c0a09]">
          {fr ? "Votre réponse" : "Your answer"}
        </p>
        <textarea
          className="w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-sm"
          rows={4}
          value={answerBody}
          onChange={(e) => setAnswerBody(e.target.value)}
          placeholder={fr ? "Min. 30 caractères" : "Min. 30 characters"}
        />
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <button
          type="button"
          disabled={busy}
          className="w-full rounded-xl bg-[#305f33] py-2.5 text-sm font-bold text-white disabled:opacity-50"
          onClick={() => void submitAnswer()}
        >
          {fr ? "Répondre (+25 BP)" : "Answer (+25 BP)"}
        </button>
      </div>

      <ul className="mt-4 space-y-3">
        {question.answers.map((a) => (
          <li key={a.id}>
            <article
              className={`fd-card px-4 py-3 ${
                a.isAccepted ? "ring-2 ring-[#305f33]/30" : ""
              }`}
            >
              <p className="text-xs text-[#78716c]">
                @{a.author.handle}
                {a.isAccepted ? (
                  <span className="ml-2 font-semibold text-[#305f33]">✓</span>
                ) : null}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[#44403c]">
                {a.body}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={a.votedByMe}
                  className="rounded-lg bg-[#f5f5f4] px-3 py-1 text-xs font-bold text-[#57534e] disabled:opacity-50"
                  onClick={() => void vote(a.id)}
                >
                  ▲ {a.voteScore}
                </button>
                {isAuthor && !a.isAccepted ? (
                  <button
                    type="button"
                    className="rounded-lg border border-[#305f33] px-3 py-1 text-xs font-bold text-[#305f33]"
                    onClick={() => void accept(a.id)}
                  >
                    {fr ? "Accepter" : "Accept"}
                  </button>
                ) : null}
              </div>
            </article>
          </li>
        ))}
      </ul>

      {bpToast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#305f33] px-4 py-2 text-sm font-bold text-white shadow-lg">
          {bpToast}
        </div>
      ) : null}
    </div>
  );
}
