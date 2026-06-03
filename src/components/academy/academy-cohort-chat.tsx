"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";

type Msg = {
  id: string;
  senderDisplay: string;
  body: string;
  messageType: string;
  createdAt: string;
  own: boolean;
};

export function AcademyCohortChat({
  editionSlug,
  programSlug,
}: {
  editionSlug: string;
  programSlug: string;
}) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const q = new URLSearchParams({ program: programSlug });
    const res = await fetchWithDeadline(
      `/api/academy/editions/${editionSlug}/messages?${q}`,
      { credentials: "include", cache: "no-store" },
      15_000,
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok) setMessages((j.messages as Msg[]) ?? []);
  }, [editionSlug, programSlug]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 12_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const res = await fetchWithDeadline(
        `/api/academy/editions/${editionSlug}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ body, programSlug }),
        },
        15_000,
      );
      if (res.ok) {
        setDraft("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[color:var(--fd-border)] bg-white overflow-hidden">
      <div className="border-b border-[color:var(--fd-border)] px-3 py-2">
        <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
          {t("academy_cohort_chat")}
        </h2>
      </div>
      <div className="max-h-64 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 ? (
          <p className="text-xs text-[color:var(--fd-muted)]">{t("academy_chat_empty")}</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`text-sm ${m.messageType === "announcement" ? "rounded-lg bg-[#e8f3ee] px-2 py-1.5" : ""}`}
            >
              <p className="text-[10px] font-bold text-[color:var(--fd-muted)]">
                {m.senderDisplay}
                {m.messageType === "announcement" ? " · 📢" : ""}
              </p>
              <p className="text-[color:var(--fd-text)]">{m.body}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-[color:var(--fd-border)] p-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={t("academy_chat_placeholder")}
          className="min-w-0 flex-1 rounded-lg border border-[color:var(--fd-border)] px-3 py-2 text-sm"
          maxLength={2000}
        />
        <button
          type="button"
          disabled={busy || !draft.trim()}
          onClick={() => void send()}
          className="shrink-0 rounded-lg bg-[color:var(--fd-primary)] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          →
        </button>
      </div>
    </section>
  );
}
