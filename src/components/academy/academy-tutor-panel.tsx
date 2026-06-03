"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { academyCls } from "@/components/academy/academy-ui";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { RenderAssistantMarkdown } from "@/lib/assistant/render-markdown";

type Turn = { role: "user" | "assistant"; content: string };

export function AcademyTutorPanel({
  editionSlug,
  programSlug,
  enabled,
}: {
  editionSlug: string;
  programSlug: string;
  enabled: boolean;
}) {
  const { t } = useI18n();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!enabled) return null;

  async function ask() {
    const message = draft.trim();
    if (!message || busy) return;
    setBusy(true);
    setErr(null);
    setTurns((prev) => [...prev, { role: "user", content: message }]);
    setDraft("");
    try {
      const res = await fetchWithDeadline(
        "/api/academy/tutor",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            editionSlug,
            programSlug,
            message,
            conversationId,
          }),
        },
        55_000,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof j.error === "string" ? j.error : t("academy_tutor_error"));
        return;
      }
      if (typeof j.conversationId === "string") {
        setConversationId(j.conversationId);
      }
      if (typeof j.reply === "string") {
        setTurns((prev) => [...prev, { role: "assistant", content: j.reply }]);
      }
    } catch {
      setErr(t("academy_tutor_error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="academy-tutor"
      className="scroll-mt-4 rounded-2xl border border-[color:var(--fd-primary)]/30 bg-[#f8faf8] p-3"
    >
      <h2 className="text-sm font-bold text-[#305f33]">{t("academy_tutor_title")}</h2>
      <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">
        {t("academy_tutor_hint")}
      </p>
      <div className="mt-2 max-h-48 overflow-y-auto space-y-2">
        {turns.map((turn, i) => (
          <div
            key={i}
            className={`rounded-lg px-2.5 py-2 text-xs leading-relaxed ${
              turn.role === "user"
                ? "ml-4 bg-white text-[color:var(--fd-text)]"
                : "mr-4 bg-[#e8f3ee] text-[#1a2e1c]"
            }`}
          >
            {turn.role === "assistant" ? (
              <RenderAssistantMarkdown text={turn.content} variant="light" />
            ) : (
              turn.content
            )}
          </div>
        ))}
      </div>
      {err ? <p className="mt-2 text-xs text-rose-700">{err}</p> : null}
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("academy_tutor_placeholder")}
          className={`min-w-0 flex-1 ${academyCls.input}`}
          maxLength={2000}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void ask()}
          className={`shrink-0 ${academyCls.btnPrimary}`}
        >
          {busy ? "…" : t("academy_tutor_send")}
        </button>
      </div>
    </section>
  );
}
