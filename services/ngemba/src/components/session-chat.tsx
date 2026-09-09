"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "citizen" | "operator";
  body: string;
  createdAt: string;
  actor?: string;
  mediaId?: string | null;
  mediaKind?: "photo" | "audio" | "video" | null;
  mediaFileName?: string | null;
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

function mediaHref(sessionId: string, mediaId: string) {
  return `/api/alerts/${sessionId}/media/${mediaId}`;
}

function AttachIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path
        d="M21.44 11.05l-8.49 8.49a5.25 5.25 0 01-7.43-7.43l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a1.75 1.75 0 01-2.47-2.47l8.49-8.48"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SessionChat({
  sessionId,
  labels,
  viewerRole = "citizen",
  discrete = false,
  locale,
  onMediaChange,
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
  /** Called after a file is uploaded via chat (refresh media list). */
  onMediaChange?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFr = locale !== "en";

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
  }, [messages.length, busy, pendingFile]);

  useEffect(() => {
    if (!pendingFile || !pendingFile.type.startsWith("image/")) {
      setPendingPreview(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPendingPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  function clearPending() {
    setPendingFile(null);
    setPendingPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function send() {
    const text = body.trim();
    if ((!text && !pendingFile) || busy) return;
    setBusy(true);
    setUploadErr(null);
    try {
      let mediaId: string | undefined;
      if (pendingFile) {
        const form = new FormData();
        form.append("file", pendingFile);
        const up = await fetch(`/api/alerts/${sessionId}/media`, {
          method: "POST",
          body: form,
          credentials: "include",
        });
        const upData = await up.json().catch(() => ({}));
        if (!up.ok || !upData.attachment?.id) {
          setUploadErr(
            upData.error === "media_limit"
              ? isFr
                ? "Limite de fichiers atteinte"
                : "File limit reached"
              : isFr
                ? "Envoi du fichier impossible"
                : "Could not upload file",
          );
          return;
        }
        mediaId = upData.attachment.id as string;
        onMediaChange?.();
      }

      const res = await fetch(`/api/alerts/${sessionId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: text,
          mediaId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages ?? []);
        setBody("");
        clearPending();
      } else {
        setUploadErr(isFr ? "Message non envoyé" : "Message not sent");
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
  const hint =
    viewerRole === "operator"
      ? "Entrée = envoyer · trombone = joindre photo, audio, vidéo ou fichier (clarification)"
      : locale === "en"
        ? "Enter = send · Shift+Enter = new line · attach photo, audio or video"
        : "Entrée = envoyer · Maj+Entrée = nouvelle ligne · joindre photo, audio ou vidéo";

  return (
    <section
      className={`flex h-[min(58vh,520px)] min-h-[340px] flex-col overflow-hidden rounded-2xl border shadow-[0_10px_28px_-18px_rgba(6,64,43,0.35)] ${shell}`}
    >
      <header className="shrink-0 border-b border-[var(--ng-border)] px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-bold ${titleCls}`}>{labels.chatTitle}</p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              discrete
                ? "bg-white/10 text-[#c9a0bc]"
                : "bg-ng-primary-muted text-ng-primary"
            }`}
          >
            <span className="size-1.5 animate-pulse rounded-full bg-current" />
            Live
          </span>
        </div>
        <p className={`text-[11px] ${headerMuted}`}>{hint}</p>
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
                ? m.actor?.trim() || "Opérateur"
                : "Citoyen";
            const href =
              m.mediaId != null
                ? mediaHref(sessionId, m.mediaId)
                : null;
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
                  {href && m.mediaKind === "photo" ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-1.5 block overflow-hidden rounded-xl"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={href}
                        alt={m.mediaFileName || "photo"}
                        className="max-h-48 w-full object-cover"
                      />
                    </a>
                  ) : null}
                  {href && m.mediaKind === "audio" ? (
                    <audio
                      controls
                      preload="metadata"
                      src={href}
                      className="mb-1.5 w-full max-w-[16rem]"
                    />
                  ) : null}
                  {href && m.mediaKind === "video" ? (
                    <video
                      controls
                      preload="metadata"
                      src={href}
                      className="mb-1.5 max-h-48 w-full rounded-xl"
                    />
                  ) : null}
                  {href &&
                  m.mediaKind &&
                  m.mediaKind !== "photo" &&
                  m.mediaKind !== "audio" &&
                  m.mediaKind !== "video" ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-1.5 block text-xs font-semibold underline"
                    >
                      {m.mediaFileName || "Fichier"}
                    </a>
                  ) : null}
                  {m.body ? (
                    <p className="whitespace-pre-wrap break-words text-sm leading-snug">
                      {m.body}
                    </p>
                  ) : null}
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
        {uploadErr ? (
          <p className="mb-2 text-xs font-medium text-ng-urgent">{uploadErr}</p>
        ) : null}
        {pendingFile ? (
          <div className="mb-2 flex items-center gap-2">
            {pendingPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pendingPreview}
                alt=""
                className="size-14 rounded-lg object-cover ring-1 ring-[var(--ng-border)]"
              />
            ) : (
              <span
                className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold ${
                  discrete
                    ? "bg-white/10 text-[#e8d4e3]"
                    : "bg-ng-primary-muted text-ng-primary"
                }`}
              >
                {pendingFile.name}
              </span>
            )}
            <button
              type="button"
              onClick={clearPending}
              className="text-xs font-semibold text-ng-urgent"
            >
              {isFr ? "Retirer" : "Remove"}
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,audio/*,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setPendingFile(f);
              setUploadErr(null);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className={
              discrete
                ? "inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 text-[#c9a0bc] disabled:opacity-50"
                : "inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ng-border)] text-ng-muted hover:border-ng-primary hover:text-ng-primary disabled:opacity-50"
            }
            aria-label={isFr ? "Joindre un fichier" : "Attach a file"}
            title={isFr ? "Joindre photo, audio ou vidéo" : "Attach photo, audio or video"}
          >
            <AttachIcon className="size-5" />
          </button>
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
            disabled={busy || (!body.trim() && !pendingFile)}
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
