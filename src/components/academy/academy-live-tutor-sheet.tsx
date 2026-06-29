"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { academyCls } from "@/components/academy/academy-ui";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { RenderAssistantMarkdown } from "@/lib/assistant/render-markdown";

/** FAB / sheet IA - discret, syllabus cohorte uniquement. */
export function AcademyLiveTutorSheet({
  editionSlug,
  programSlug,
  open,
  onClose,
}: {
  editionSlug: string;
  programSlug: string;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  async function ask() {
    const message = draft.trim();
    if (!message || busy) return;
    setBusy(true);
    setErr(null);
    setReply(null);
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
        setErr(t("academy_tutor_error"));
        return;
      }
      if (typeof j.conversationId === "string") {
        setConversationId(j.conversationId);
      }
      if (typeof j.reply === "string") {
        setReply(j.reply);
        setDraft("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
      role="dialog"
      aria-modal
      aria-label={t("academy_oc_ai_sheet")}
    >
      <button
        type="button"
        className="min-h-0 flex-1"
        aria-label={t("academy_oc_close")}
        onClick={onClose}
      />
      <div className="max-h-[70dvh] overflow-hidden rounded-t-2xl border-t border-[color:var(--fd-border)] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[color:var(--fd-border)] px-4 py-3">
          <div>
            <p className="text-sm font-extrabold text-[#305f33]">{t("academy_oc_ai_sheet")}</p>
            <p className="text-[10px] text-[color:var(--fd-muted)]">{t("academy_tutor_hint")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-bold text-[color:var(--fd-muted)]"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3 pb-4">
          {reply ? (
            <div className="mb-3 rounded-xl bg-[#f8faf8] p-3 text-sm">
              <RenderAssistantMarkdown text={reply} />
            </div>
          ) : null}
          {err ? <p className="mb-2 text-xs text-rose-700">{err}</p> : null}
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("academy_tutor_placeholder")}
              className={`min-w-0 flex-1 ${academyCls.input}`}
              maxLength={500}
            />
            <button
              type="button"
              disabled={busy || !draft.trim()}
              onClick={() => void ask()}
              className={`shrink-0 ${academyCls.btnPrimary}`}
            >
              {busy ? "…" : t("academy_tutor_send")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
