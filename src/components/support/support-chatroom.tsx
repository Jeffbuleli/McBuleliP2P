"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { SupportMessageRow } from "@/components/support/support-message-row";
import type { SupportMessageDto, SupportParticipant } from "@/lib/support-service";
import { wrapSelection } from "@/lib/support-rich-text";

const EMOJIS = ["👍", "🙏", "✅", "❓", "🔥", "💚", "📷", "⏳", "🎉", "⚠️"];

type Mode = "user" | "staff";

export function SupportChatroom({
  mode,
  threadId: threadIdProp,
  backHref,
}: {
  mode: Mode;
  threadId?: string;
  backHref: string;
}) {
  const { t, locale } = useI18n();
  const [threadId, setThreadId] = useState<string | null>(threadIdProp ?? null);
  const [messages, setMessages] = useState<SupportMessageDto[]>([]);
  const [participants, setParticipants] = useState<SupportParticipant[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [pendingImages, setPendingImages] = useState<
    { dataUrl: string; mime: string; sizeBytes: number }[]
  >([]);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const apiBase =
    mode === "staff" && threadId
      ? `/api/admin/support/threads/${encodeURIComponent(threadId)}`
      : "/api/support";

  const mentionMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of participants) m.set(p.handle.toLowerCase(), p.label);
    return m;
  }, [participants]);

  const loadMentionables = useCallback(async () => {
    const q = threadId ? `?threadId=${encodeURIComponent(threadId)}` : "";
    const res = await fetch(`/api/support/mentionables${q}`, {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.participants)) {
      setParticipants(data.participants as SupportParticipant[]);
    }
  }, [threadId]);

  const loadMessages = useCallback(async () => {
    if (mode === "staff" && !threadId) return;
    const url =
      mode === "staff"
        ? `${apiBase}/messages`
        : threadId
          ? `/api/support/messages?threadId=${encodeURIComponent(threadId)}`
          : "/api/support/messages";
    const res = await fetch(url, { credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const key = typeof data.error === "string" ? data.error : "";
      setErr(key && key in { support_unavailable: 1, support_forbidden: 1 } ? t(key as never) : t("support_unavailable"));
      return;
    }
    setErr(null);
    if (typeof data.thread?.id === "string") setThreadId(data.thread.id);
    setMessages((data.messages as SupportMessageDto[]) ?? []);
    const tid = (data.thread?.id as string) ?? threadId;
    if (tid) {
      const readUrl = mode === "staff" ? `${apiBase}/read` : "/api/support/read";
      void fetch(readUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: tid }),
      });
    }
  }, [apiBase, mode, t, threadId]);

  useEffect(() => {
    if (mode === "user" && !threadIdProp) {
      void fetch("/api/support/thread", { credentials: "include", cache: "no-store" })
        .then((r) => r.json())
        .then((j: { thread?: { id: string } }) => {
          if (j.thread?.id) setThreadId(j.thread.id);
        });
    }
  }, [mode, threadIdProp]);

  useEffect(() => {
    void loadMentionables();
  }, [loadMentionables]);

  useEffect(() => {
    void loadMessages();
    const id = window.setInterval(() => void loadMessages(), 4500);
    return () => window.clearInterval(id);
  }, [loadMessages]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body && !pendingImages.length) return;
    setBusy(true);
    setErr(null);
    const payload = {
      threadId: threadId ?? undefined,
      body: body || " ",
      attachments: pendingImages.map((img) => ({
        type: "image" as const,
        ...img,
      })),
    };
    const url =
      mode === "staff" && threadId ? `${apiBase}/messages` : "/api/support/messages";
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const key = typeof data.error === "string" ? data.error : "";
      setErr(key ? t(key as never) : t("support_empty"));
      return;
    }
    setDraft("");
    setPendingImages([]);
    setShowEmoji(false);
    void loadMessages();
  }

  function applyFormat(wrap: "**" | "*" | "__") {
    const el = textareaRef.current;
    if (!el) return;
    const { next, cursor } = wrapSelection(
      draft,
      el.selectionStart,
      el.selectionEnd,
      wrap,
    );
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  function insertMention(p: SupportParticipant) {
    const el = textareaRef.current;
    const at = draft.lastIndexOf("@");
    const prefix = at >= 0 ? draft.slice(0, at) : draft;
    setDraft(`${prefix}@${p.handle} `);
    setMentionOpen(false);
    el?.focus();
  }

  function onDraftChange(v: string) {
    setDraft(v);
    setMentionOpen(v.endsWith("@") || /@[\w.-]*$/.test(v));
  }

  const mentionFilter = (() => {
    const m = draft.match(/@([\w.-]*)$/);
    return (m?.[1] ?? "").toLowerCase();
  })();

  const filteredMentions = participants.filter(
    (p) =>
      p.handle.toLowerCase().includes(mentionFilter) ||
      p.label.toLowerCase().includes(mentionFilter),
  );

  async function onPickImage(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 350_000) {
      setErr(t("support_too_long"));
      return;
    }
    const buf = await file.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    setPendingImages((prev) =>
      prev.length >= 2
        ? prev
        : [...prev, { dataUrl: `data:${file.type};base64,${b64}`, mime: file.type, sizeBytes: file.size }],
    );
  }

  return (
    <div className="-mx-4 flex min-h-[calc(100dvh-5.5rem)] flex-col bg-[var(--fd-bg)]">
      <header className="sticky top-0 z-20 border-b border-[color:var(--fd-border)] bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--fd-primary)] text-white shadow-md active:scale-95"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M14 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--fd-primary)] text-white">
            <SupportHeadsetIcon className="h-5 w-5" />
          </div>
          <h1 className="min-w-0 flex-1 text-lg font-extrabold text-[color:var(--fd-text)]">
            {t("support_title")}
          </h1>
        </div>
      </header>

      {err ? (
        <p className="mx-4 mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {err}
        </p>
      ) : null}

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-3"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 && !err ? (
          <p className="py-12 text-center text-sm text-[color:var(--fd-muted)]">
            {t("support_empty_room")}
          </p>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => (
              <SupportMessageRow
                key={m.id}
                message={m}
                mentionHandles={mentionMap}
                locale={locale}
              />
            ))}
          </ul>
        )}
      </div>

      {pendingImages.length > 0 ? (
        <div className="flex gap-2 px-4 pb-2">
          {pendingImages.map((img, i) => (
            <div key={i} className="relative h-14 w-14 overflow-hidden rounded-lg border border-[color:var(--fd-border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.dataUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute right-0 top-0 bg-black/60 px-1 text-[10px] text-white"
                onClick={() => setPendingImages((p) => p.filter((_, j) => j !== i))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {mentionOpen && filteredMentions.length > 0 ? (
        <ul className="mx-4 mb-1 max-h-28 overflow-y-auto rounded-xl border border-[color:var(--fd-border)] bg-white shadow-lg">
          {filteredMentions.slice(0, 6).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[color:var(--fd-mint)]"
                onClick={() => insertMention(p)}
              >
                <span className="font-bold text-[color:var(--fd-primary)]">@{p.handle}</span>
                <span className="truncate text-[color:var(--fd-muted)]">{p.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {showEmoji ? (
        <div className="flex flex-wrap gap-1 px-4 pb-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className="rounded-lg px-2 py-1 text-lg hover:bg-[color:var(--fd-mint)]"
              onClick={() => setDraft((d) => d + e)}
            >
              {e}
            </button>
          ))}
        </div>
      ) : null}

      <footer className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-20 rounded-t-2xl border border-b-0 border-[color:var(--fd-border)] bg-white px-3 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="mb-1.5 flex items-center gap-0.5">
          <FormatBtn label="B" onClick={() => applyFormat("**")} />
          <FormatBtn label="I" onClick={() => applyFormat("*")} />
          <FormatBtn label="U" onClick={() => applyFormat("__")} />
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-xs font-bold text-[color:var(--fd-muted)] hover:bg-[color:var(--fd-mint)]"
            onClick={() => setShowEmoji((s) => !s)}
            aria-label="Emoji"
          >
            ☺
          </button>
          <label className="cursor-pointer rounded-lg px-2 py-1 text-xs font-bold text-[color:var(--fd-primary)] hover:bg-[color:var(--fd-mint)]">
            {t("support_attach_image")}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onPickImage(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            rows={2}
            placeholder={t("support_placeholder")}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-[color:var(--fd-border)] bg-[var(--fd-bg)] px-3 py-2 text-sm outline-none focus:border-[color:var(--fd-primary)]"
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
            className="shrink-0 self-end rounded-xl bg-[color:var(--fd-primary)] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
          >
            {t("support_send")}
          </button>
        </div>
        <p className="mt-1 text-center text-[9px] text-[color:var(--fd-muted)]">
          {t("support_image_policy")}
        </p>
      </footer>
    </div>
  );
}

function FormatBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded-lg px-2 py-1 text-xs font-extrabold text-[color:var(--fd-text)] hover:bg-[color:var(--fd-mint)]"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function SupportHeadsetIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a4 4 0 00-4 4v2.5a4 4 0 008 0V6a4 4 0 00-4-4zm-6 8.5A6 6 0 0112 5a6 6 0 016 5.5V14a2 2 0 01-2 2h-1v3.5a1.5 1.5 0 11-3 0V16h-2v3.5a1.5 1.5 0 11-3 0V16H8a2 2 0 01-2-2v-3.5zM9 14h6v2H9v-2z" />
    </svg>
  );
}
