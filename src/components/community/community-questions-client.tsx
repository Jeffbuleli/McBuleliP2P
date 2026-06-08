"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityRewardsCard } from "@/components/community/community-rewards-card";
import type { QuestionListItem } from "@/lib/community/qa-service";

export function CommunityQuestionsClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bpToast, setBpToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/community/questions");
      const j = await res.json();
      setQuestions((j.questions ?? []) as QuestionListItem[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/community/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "failed");
        return;
      }
      setQuestions((q) => [j.question as QuestionListItem, ...q]);
      setTitle("");
      setBody("");
      setShowComposer(false);
      if (j.bpGranted?.granted) {
        setBpToast(`+${j.bpGranted.points} BP`);
        setTimeout(() => setBpToast(null), 3000);
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-4">
      <Link href="/app/community" className="text-sm font-semibold text-[#305f33]">
        ← {fr ? "Communauté" : "Community"}
      </Link>
      <h1 className="mt-3 text-xl font-bold text-[#0c0a09]">
        {fr ? "Questions" : "Q&A"}
      </h1>
      <p className="mb-4 text-sm text-[#57534e]">
        {fr ? "Poser, répondre, voter" : "Ask, answer, vote"}
      </p>

      <CommunityRewardsCard />

      <button
        type="button"
        className="mb-4 w-full rounded-xl border border-dashed border-[#305f33] py-2.5 text-sm font-bold text-[#305f33]"
        onClick={() => setShowComposer((v) => !v)}
      >
        {showComposer
          ? fr
            ? "Fermer"
            : "Close"
          : fr
            ? "Poser une question (+20 BP)"
            : "Ask a question (+20 BP)"}
      </button>

      {showComposer ? (
        <div className="fd-card mb-4 space-y-3 px-4 py-4">
          <input
            className="w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={fr ? "Titre (min. 10)" : "Title (min. 10)"}
          />
          <textarea
            className="w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-sm"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={fr ? "Détails (min. 20 car.)" : "Details (min. 20 chars)"}
          />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <button
            type="button"
            disabled={publishing}
            className="w-full rounded-xl bg-[#305f33] py-2.5 text-sm font-bold text-white disabled:opacity-50"
            onClick={() => void publish()}
          >
            {publishing ? "…" : fr ? "Publier" : "Post"}
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-[#78716c]">…</p>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <li key={q.id}>
              <Link
                href={`/app/community/questions/${q.id}`}
                className="fd-card block px-4 py-3"
              >
                <p className="text-sm font-bold text-[#0c0a09]">{q.title}</p>
                <p className="mt-1 text-xs text-[#78716c]">
                  @{q.author.handle} · {q.answerCount}{" "}
                  {fr ? "réponses" : "answers"}
                  {q.hasAcceptedAnswer ? " · ✓" : ""}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-[#57534e]">{q.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {bpToast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#305f33] px-4 py-2 text-sm font-bold text-white shadow-lg">
          {bpToast}
        </div>
      ) : null}
    </div>
  );
}
