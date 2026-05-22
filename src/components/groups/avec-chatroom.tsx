"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { avecCls } from "@/components/groups/avec-ui";
import { clientErrorText } from "@/lib/client-error-text";

type Msg = {
  id: string;
  senderUserId: string;
  senderEmail: string;
  body: string;
  messageType: string;
  attachmentUrl: string | null;
  createdAt: string;
};

export function AvecChatroom({
  groupId,
  myUserId,
  canPost,
}: {
  groupId: string;
  myUserId?: string;
  canPost: boolean;
}) {
  const { t, locale } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/messages`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((j as { error?: string }).error ?? "…");
      return;
    }
    setMessages((j.messages ?? []) as Msg[]);
  }, [groupId]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || busy || !canPost) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "…");
        return;
      }
      setDraft("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  const loc = locale === "fr" ? "fr-FR" : "en-US";

  return (
    <div className={`${avecCls.section} flex flex-col`} style={{ minHeight: "320px" }}>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: "50vh" }}>
        {messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-[color:var(--fd-muted)]">
            {t("avec_chat_empty")}
          </p>
        ) : (
          messages.map((m) => {
            const mine = myUserId && m.senderUserId === myUserId;
            const system = m.messageType === "system";
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                    system
                      ? "border border-dashed border-[color:var(--fd-border)] bg-stone-50 text-[color:var(--fd-muted)]"
                      : mine
                        ? "bg-[color:var(--fd-primary)] text-white"
                        : "border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] text-[color:var(--fd-text)]"
                  }`}
                >
                  {!system && !mine ? (
                    <p className="mb-0.5 text-[9px] font-bold opacity-70">{m.senderEmail}</p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  {m.attachmentUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.attachmentUrl}
                      alt=""
                      className="mt-2 max-h-32 rounded-lg object-contain"
                    />
                  ) : null}
                  <p className="mt-1 text-[9px] opacity-60">
                    {new Date(m.createdAt).toLocaleString(loc)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      {err ? (
        <p className="mt-2 text-xs text-rose-700">{clientErrorText(t, err)}</p>
      ) : null}
      {canPost ? (
        <div className="mt-3 flex gap-2 border-t border-[color:var(--fd-border)] pt-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("avec_chat_placeholder")}
            className={avecCls.input}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void send()}
            className={`${avecCls.btnPrimary} !w-auto shrink-0 px-4`}
          >
            →
          </button>
        </div>
      ) : (
        <p className="mt-2 text-center text-[10px] text-[color:var(--fd-muted)]">
          {t("avec_chat_readonly")}
        </p>
      )}
    </div>
  );
}
