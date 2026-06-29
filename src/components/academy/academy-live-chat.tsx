"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { academyCls } from "@/components/academy/academy-ui";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";

type Msg = {
  id: string;
  senderDisplay: string;
  body: string;
  own: boolean;
};

/** Chat live léger - polling court, pas d'invites, UI minimale. */
export function AcademyLiveChat({
  editionSlug,
  programSlug,
  pollMs = 5000,
}: {
  editionSlug: string;
  programSlug: string;
  pollMs?: number;
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
      12_000,
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      const rows = ((j.messages as Msg[]) ?? []).slice(-40);
      setMessages(rows);
    }
  }, [editionSlug, programSlug]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

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
        12_000,
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
    <section className="rounded-2xl border border-[#305f33]/25 bg-white overflow-hidden">
      <div className="border-b border-[color:var(--fd-border)] bg-[#f8faf8] px-3 py-2">
        <h2 className="text-sm font-bold text-[#305f33]">{t("academy_live_chat_title")}</h2>
        <p className="text-[10px] text-[color:var(--fd-muted)]">{t("academy_live_chat_hint")}</p>
      </div>
      <div className="max-h-44 overflow-y-auto px-3 py-2 space-y-1.5">
        {messages.length === 0 ? (
          <p className="text-xs text-[color:var(--fd-muted)]">{t("academy_live_chat_empty")}</p>
        ) : (
          messages.map((m) => (
            <p
              key={m.id}
              className={`text-xs leading-snug ${m.own ? "text-[#305f33]" : "text-[color:var(--fd-text)]"}`}
            >
              <span className="font-bold">{m.senderDisplay}</span> · {m.body}
            </p>
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
          placeholder={t("academy_live_chat_placeholder")}
          className={`min-w-0 flex-1 ${academyCls.input}`}
          maxLength={500}
          autoComplete="off"
        />
        <button
          type="button"
          disabled={busy || !draft.trim()}
          onClick={() => void send()}
          className={`shrink-0 px-3 ${academyCls.btnPrimary}`}
          aria-label={t("academy_live_chat_send")}
        >
          →
        </button>
      </div>
    </section>
  );
}
