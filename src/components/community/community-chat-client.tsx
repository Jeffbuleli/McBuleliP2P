"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  AdminGoldBadge,
  BlueCheckBadge,
  KycVerifiedBadge,
} from "@/components/community/community-badges";
import { IconAttach, IconSend, IconWarning } from "@/components/community/community-icons";
import {
  IconCheck,
  IconDoubleCheck,
} from "@/components/community/community-inline-icons";
import { uploadCommunityImage } from "@/lib/community-media-upload";
import type { DmMessageView } from "@/lib/community/dm-service";

type ThreadMeta = {
  id: string;
  peer: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    verifiedBlue: boolean;
    isAdmin: boolean;
    showKycBadge: boolean;
    online: boolean;
  };
  status: string;
  isRequest: boolean;
};

function messagesFingerprint(list: DmMessageView[]): string {
  return list
    .map(
      (m) =>
        `${m.id}:${m.read ? 1 : 0}:${m.delivered ? 1 : 0}:${m.hidden ? 1 : 0}`,
    )
    .join("|");
}

export function CommunityChatClient({ threadId }: { threadId: string }) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const searchParams = useSearchParams();
  const [meta, setMeta] = useState<ThreadMeta | null>(null);
  const [messages, setMessages] = useState<DmMessageView[]>([]);
  const [text, setText] = useState("");
  const [storyRefId, setStoryRefId] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number | null>(null);
  const msgFpRef = useRef("");
  const prevCountRef = useRef(0);

  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/community/dm/threads/${threadId}/messages`);
    const j = await res.json();
    if (res.ok) {
      const next = (j.messages ?? []) as DmMessageView[];
      const fp = messagesFingerprint(next);
      if (fp !== msgFpRef.current) {
        msgFpRef.current = fp;
        setMessages(next);
      }
      setTyping((prev) => {
        const t = !!j.peerTyping;
        return prev === t ? prev : t;
      });
    }
  }, [threadId]);

  useEffect(() => {
    const draft = searchParams.get("draft");
    const storyId = searchParams.get("storyId");
    if (draft) setText(draft);
    if (storyId) setStoryRefId(storyId);
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/community/dm/threads")
      .then((r) => r.json())
      .then((d: { threads?: ThreadMeta[] }) => {
        const t = (d.threads ?? []).find((x) => x.id === threadId);
        if (t) setMeta(t);
      });
    void loadMessages();
    const poll = window.setInterval(() => void loadMessages(), 3000);
    return () => window.clearInterval(poll);
  }, [threadId, loadMessages]);

  useEffect(() => {
    const count = messages.length;
    if (count > prevCountRef.current || typing) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = count;
  }, [messages, typing]);

  const sendTyping = () => {
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    void fetch(`/api/community/dm/threads/${threadId}/typing`, {
      method: "POST",
    });
    typingTimer.current = window.setTimeout(() => {
      typingTimer.current = null;
    }, 2000);
  };

  const send = async () => {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setText("");
    try {
      const res = await fetch(
        `/api/community/dm/threads/${threadId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );
      if (res.ok) await loadMessages();
    } finally {
      setBusy(false);
    }
  };

  const acceptRequest = async () => {
    await fetch(`/api/community/dm/threads/${threadId}/accept`, {
      method: "POST",
    });
    setMeta((m) => (m ? { ...m, status: "active", isRequest: false } : m));
  };

  const blockPeer = async () => {
    if (!meta) return;
    await fetch("/api/community/dm/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: meta.peer.handle }),
    });
    setMenuOpen(false);
  };

  const reportThread = async () => {
    await fetch("/api/community/dm/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId,
        reason: "scam",
        details: "Reported from chat",
      }),
    });
    setMenuOpen(false);
  };

  const attachImage = async (file: File) => {
    setBusy(true);
    try {
      const uploaded = await uploadCommunityImage(file, "posts");
      if (!uploaded?.id) return;
      await fetch(`/api/community/dm/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: "",
          messageType: "image",
          mediaId: uploaded.id,
        }),
      });
      await loadMessages();
    } finally {
      setBusy(false);
    }
  };

  if (!meta) {
    return (
      <div className="community-theme mx-auto max-w-lg px-4 py-16 text-center text-sm text-[#78716c]">
        …
      </div>
    );
  }

  return (
    <div className="community-theme mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-lg flex-col">
      <header className="flex items-center gap-3 border-b border-[#f0f4f2] bg-white px-4 py-3 shadow-sm">
        <Link
          href="/app/community/inbox"
          className="text-sm font-semibold text-[#305f33]"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#0c0a09]">
            {meta.peer.displayName}
            {meta.peer.isAdmin ? (
              <span className="ml-1"><AdminGoldBadge fr={fr} /></span>
            ) : null}
            {meta.peer.showKycBadge ? (
              <span className="ml-1"><KycVerifiedBadge fr={fr} /></span>
            ) : null}
            {meta.peer.verifiedBlue ? (
              <span className="ml-1"><BlueCheckBadge fr={fr} /></span>
            ) : null}
          </p>
          <p className="text-[11px] text-[#78716c]">
            @{meta.peer.handle}
            {meta.peer.online
              ? fr
                ? " · En ligne"
                : " · Online"
              : ""}
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#57534e]"
            aria-label="Menu"
          >
            ⋮
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-[#f0f4f2] bg-white py-1 shadow-lg">
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-[#57534e] hover:bg-[#fafafa]"
                onClick={() => void reportThread()}
              >
                {fr ? "Signaler" : "Report"}
              </button>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                onClick={() => void blockPeer()}
              >
                {fr ? "Bloquer" : "Block"}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {meta.isRequest ? (
        <div className="border-b border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-center text-xs text-[#92400e]">
          {fr ? "Demande de message - " : "Message request - "}
          <button
            type="button"
            className="font-bold underline"
            onClick={() => void acceptRequest()}
          >
            {fr ? "Accepter" : "Accept"}
          </button>
        </div>
      ) : null}

      <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-[#f5f7f6] to-[#fafaf9] px-3 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-end gap-2 ${m.own ? "flex-row-reverse" : "flex-row"}`}
          >
            {!m.own ? (
              <PeerAvatar peer={meta.peer} />
            ) : (
              <span className="h-8 w-8 shrink-0" aria-hidden />
            )}
            <div className={`flex max-w-[78%] flex-col ${m.own ? "items-end" : "items-start"}`}>
              {!m.own ? (
                <span className="mb-1 px-1 text-[10px] font-semibold text-[#78716c]">
                  {meta.peer.displayName}
                </span>
              ) : null}
              <div
                className={`w-full rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                  m.own
                    ? "rounded-br-md bg-gradient-to-br from-[#3d8f5a] to-[#305f33] text-white"
                    : "rounded-bl-md border border-[#e8f3ee] bg-white text-[#1c1917]"
                }`}
              >
                {m.hidden ? (
                  <p className="flex items-center gap-1 text-xs italic opacity-80">
                    <IconWarning size={14} />
                    {fr
                      ? "Message masqué (sécurité anti-arnaque)"
                      : "Message hidden (anti-scam)"}
                  </p>
                ) : (
                  <>
                    {m.attachmentUrl && m.messageType === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.attachmentUrl}
                        alt=""
                        className="mb-1 max-h-52 w-full rounded-xl object-cover"
                      />
                    ) : null}
                    {m.body ? (
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                    ) : null}
                  </>
                )}
              </div>
              <p
                className={`mt-1 px-1 text-[9px] tabular-nums ${
                  m.own ? "text-[#78716c]" : "text-[#a8a29e]"
                }`}
              >
                {new Date(m.createdAt).toLocaleTimeString(
                  fr ? "fr-FR" : "en-US",
                  { hour: "2-digit", minute: "2-digit" },
                )}
                {m.own ? (
                  m.read ? (
                    <span className="ml-1 inline-flex align-middle text-[#305f33]">
                      <IconDoubleCheck className="h-3 w-3" />
                    </span>
                  ) : m.delivered ? (
                    <span className="ml-1 inline-flex align-middle text-[#78716c]">
                      <IconCheck className="h-3 w-3" />
                    </span>
                  ) : null
                ) : null}
              </p>
            </div>
          </div>
        ))}
        {typing ? (
          <p className="text-xs text-[#78716c]">
            {fr ? "écrit…" : "typing…"}
          </p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <footer className="border-t border-[#f0f4f2] bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {storyRefId ? (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#f0f7f3] px-3 py-2 text-xs text-[#305f33]">
            <span className="flex-1 font-semibold">
              {fr ? "Réponse privée à un statut" : "Private reply to a status"}
            </span>
            <button
              type="button"
              onClick={() => setStoryRefId(null)}
              className="text-[#78716c]"
              aria-label={fr ? "Retirer la référence" : "Remove reference"}
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <label
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#f0f7f3] text-[#305f33]"
            aria-label={fr ? "Joindre une image" : "Attach image"}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy || meta.status !== "active"}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void attachImage(f);
                e.target.value = "";
              }}
            />
            <IconAttach size={20} />
          </label>
          <textarea
            value={text}
            disabled={busy || meta.status !== "active"}
            onChange={(e) => {
              setText(e.target.value);
              sendTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder={
              meta.status !== "active"
                ? fr
                  ? "Acceptez la demande pour répondre"
                  : "Accept request to reply"
                : fr
                  ? "Message…"
                  : "Message…"
            }
            className="max-h-24 min-h-[44px] flex-1 resize-none rounded-xl border border-[#e8f3ee] bg-[#fafaf9] px-3 py-2.5 text-sm"
          />
          <button
            type="button"
            disabled={busy || !text.trim() || meta.status !== "active"}
            onClick={() => void send()}
            aria-label={fr ? "Envoyer" : "Send"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#305f33] text-white disabled:opacity-50"
          >
            <IconSend />
          </button>
        </div>
      </footer>
    </div>
  );
}

function PeerAvatar({
  peer,
}: {
  peer: ThreadMeta["peer"];
}) {
  if (peer.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={peer.avatarUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
      />
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f3ee] text-xs font-bold text-[#305f33] ring-2 ring-white shadow-sm">
      {peer.displayName.slice(0, 1).toUpperCase()}
    </span>
  );
}
