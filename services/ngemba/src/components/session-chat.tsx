"use client";

import { useCallback, useEffect, useState } from "react";

type ChatMessage = {
  id: string;
  role: "citizen" | "operator";
  body: string;
  createdAt: string;
  actor?: string;
};

export function SessionChat({
  sessionId,
  labels,
}: {
  sessionId: string;
  labels: {
    chatTitle: string;
    chatPlaceholder: string;
    chatSend: string;
    chatEmpty: string;
  };
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

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
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

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

  return (
    <div className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
      <p className="text-sm font-semibold text-ng-primary">{labels.chatTitle}</p>
      <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-xs text-ng-muted">{labels.chatEmpty}</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl px-3 py-2 text-sm ${
                m.role === "citizen"
                  ? "ml-4 bg-ng-primary-muted text-ng-primary"
                  : "mr-4 bg-ng-secondary-muted/50 text-ng-text"
              }`}
            >
              {m.body}
            </div>
          ))
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={labels.chatPlaceholder}
          className="min-h-10 flex-1 rounded-xl border border-[var(--ng-border)] px-3 text-sm"
        />
        <button
          type="button"
          disabled={busy || !body.trim()}
          onClick={() => void send()}
          className="min-h-10 rounded-xl bg-ng-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {labels.chatSend}
        </button>
      </div>
    </div>
  );
}
