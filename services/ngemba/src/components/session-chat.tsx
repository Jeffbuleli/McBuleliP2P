"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "citizen" | "operator";
  body: string;
  createdAt: string;
  actor?: string;
};

function formatTime(iso: string, locale?: string) {
  try {
    return new Date(iso).toLocaleString(locale === "en" ? "en-GB" : "fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function bubbleTimeClass(mine: boolean, discrete: boolean) {
  if (mine) return "mt-1 text-right text-[9px] text-white/70";
  if (discrete) return "mt-1 text-[9px] text-[#c9a0bc]";
  return "mt-1 text-[9px] text-ng-muted";
}

function bubbleClass(mine: boolean, discrete: boolean) {
  if (mine) {
    return discrete
      ? "max-w-[min(85%,22rem)] rounded-2xl rounded-br-md bg-[#882364] px-3 py-2 text-white"
      : "max-w-[min(85%,22rem)] rounded-2xl rounded-br-md bg-ng-primary px-3 py-2 text-white";
  }
  return discrete
    ? "max-w-[min(85%,22rem)] rounded-2xl rounded-bl-md bg-white/10 px-3 py-2 text-[#f5f0f4] ring-1 ring-white/15"
    : "max-w-[min(85%,22rem)] rounded-2xl rounded-bl-md bg-ng-bg px-3 py-2 text-ng-text ring-1 ring-[var(--ng-border)]";
}

export function SessionChat({
  sessionId,
  labels,
  viewerRole = "citizen",
  discrete = false,
  locale,
}: {
  sessionId: string;
  labels: {
    chatTitle: string;
    chatPlaceholder: string;
    chatSend: string;
    chatEmpty: string;
  };
  /** Who is looking - their messages align right like e-AVEC / Hackathon. */
  viewerRole?: "citizen" | "operator";
  discrete?: boolean;
  locale?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/alerts/${sessionId}/messages`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
  }, [sessionId]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  async function send() {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/alerts/${sessionId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages ?? []);
        setBody("");
      }
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const shell = discrete
    ? "border-white/10 bg-white/[0.04]"
    : "border-[var(--ng-border)] bg-ng-surface";
  const headerMuted = discrete ? "text-[#c9a0bc]" : "text-ng-muted";
  const titleCls = discrete ? "text-[#e8d4e3]" : "text-ng-primary";

  return (
    <section
      className={`flex h-[min(58vh,520px)] min-h-[340px] flex-col overflow-hidden rounded-2xl border shadow-[0_10px_28px_-18px_rgba(6,64,43,0.35)] ${shell}`}
    >
      <header className="shrink-0 border-b border-[var(--ng-border)] px-4 py-2.5">
        <p className={`text-sm font-bold ${titleCls}`}>{labels.chatTitle}</p>
        <p className={`text-[11px] ${headerMuted}`}>
          Entree = envoyer · Maj+Entree = nouvelle ligne
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3">
        {messages.length === 0 ? (
          <p className={`py-12 text-center text-sm ${headerMuted}`}>
            {labels.chatEmpty}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.role === viewerRole;
            const peerLabel =
              m.role === "operator"
                ? m.actor?.trim() || "Operateur"
                : "Citoyen";
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div className={bubbleClass(mine, discrete)}>
                  {!mine ? (
                    <p
                      className={
                        discrete
                          ? "mb-0.5 text-[10px] font-bold text-[#c9a0bc]"
                          : "mb-0.5 text-[10px] font-bold text-ng-secondary"
                      }
                    >
                      {peerLabel}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words text-sm leading-snug">
                    {m.body}
                  </p>
                  <p className={bubbleTimeClass(mine, discrete)}>
                    {formatTime(m.createdAt, locale)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="shrink-0 border-t border-[var(--ng-border)] p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 2000))}
            onKeyDown={onKeyDown}
            placeholder={labels.chatPlaceholder}
            rows={2}
            maxLength={2000}
            className={
              discrete
                ? "min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-[#f5f0f4] outline-none ring-[#882364] placeholder:text-[#c9a0bc] focus:ring-2"
                : "min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-[var(--ng-border)] bg-ng-bg px-3 py-2.5 text-sm text-ng-text outline-none ring-ng-primary focus:ring-2"
            }
          />
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className={
              discrete
                ? "inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-[#882364] px-4 text-sm font-semibold text-white disabled:opacity-50"
                : "inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-ng-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
            }
          >
            {labels.chatSend}
          </button>
        </div>
      </form>
    </section>
  );
}
