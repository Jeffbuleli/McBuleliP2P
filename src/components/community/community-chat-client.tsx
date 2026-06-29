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
  COMMUNITY_AVATAR_RING,
  COMMUNITY_BACK_LINK,
  COMMUNITY_CHAT_BODY,
  COMMUNITY_CHAT_FOOTER,
  COMMUNITY_CHAT_HEADER,
  COMMUNITY_MEDIA_FRAME,
  COMMUNITY_OWNER_MENU,
  COMMUNITY_SEND_BTN,
  COMMUNITY_TEXTAREA,
} from "@/lib/community/community-ui";
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
      <div className="community-theme mx-auto max-w-lg px-4 py-16 text-center text-sm text-stone-400">
        …
      </div>
    );
  }

  return (
    <div className="community-theme mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-lg flex-col">
      <header className={COMMUNITY_CHAT_HEADER}>
        <Link href="/app/community/inbox" className={COMMUNITY_BACK_LINK}>
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-stone-50">
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
          <p className="text-[11px] text-stone-400">
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
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-400 hover:bg-white/5"
            aria-label="Menu"
          >
            ⋮
          </button>
          {menuOpen ? (
            <div className={`${COMMUNITY_OWNER_MENU} w-44`}>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-stone-300 hover:bg-white/5"
                onClick={() => void reportThread()}
              >
                {fr ? "Signaler" : "Report"}
              </button>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-400/10"
                onClick={() => void blockPeer()}
              >
                {fr ? "Bloquer" : "Block"}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {meta.isRequest ? (
        <div className="border-b border-amber-400/20 bg-amber-400/10 px-4 py-3 text-center text-xs text-amber-200">
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

      <div className={COMMUNITY_CHAT_BODY}>
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
                <span className="mb-1 px-1 text-[10px] font-semibold text-stone-400">
                  {meta.peer.displayName}
                </span>
              ) : null}
              <div
                className={`w-full rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                  m.own
                    ? "rounded-br-md border border-emerald-400/25 bg-gradient-to-br from-emerald-500/35 to-emerald-600/20 text-stone-50"
                    : "rounded-bl-md border border-white/10 bg-[rgba(10,16,24,0.88)] text-stone-100"
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
                      <div className={`${COMMUNITY_MEDIA_FRAME} mb-1`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.attachmentUrl}
                          alt=""
                          className="max-h-52 w-full object-cover"
                        />
                      </div>
                    ) : null}
                    {m.body ? (
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                    ) : null}
                  </>
                )}
              </div>
              <p
                className={`mt-1 px-1 text-[9px] tabular-nums ${
                  m.own ? "text-stone-500" : "text-stone-600"
                }`}
              >
                {new Date(m.createdAt).toLocaleTimeString(
                  fr ? "fr-FR" : "en-US",
                  { hour: "2-digit", minute: "2-digit" },
                )}
                {m.own
                  ? m.read
                    ? " · ✓✓"
                    : m.delivered
                      ? " · ✓"
                      : ""
                  : ""}
              </p>
            </div>
          </div>
        ))}
        {typing ? (
          <p className="text-xs text-stone-500">
            {fr ? "écrit…" : "typing…"}
          </p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <footer className={COMMUNITY_CHAT_FOOTER}>
        {storyRefId ? (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300">
            <span className="flex-1 font-semibold">
              {fr ? "Réponse privée à un statut" : "Private reply to a status"}
            </span>
            <button
              type="button"
              onClick={() => setStoryRefId(null)}
              className="text-stone-400"
              aria-label={fr ? "Retirer la référence" : "Remove reference"}
            >
              ✕
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <label
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
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
            className={`${COMMUNITY_TEXTAREA} max-h-24 min-h-[44px] flex-1`}
          />
          <button
            type="button"
            disabled={busy || !text.trim() || meta.status !== "active"}
            onClick={() => void send()}
            aria-label={fr ? "Envoyer" : "Send"}
            className={`${COMMUNITY_SEND_BTN} h-11 w-11 disabled:opacity-50`}
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
        className={`h-8 w-8 shrink-0 rounded-full object-cover ${COMMUNITY_AVATAR_RING}`}
      />
    );
  }
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs font-bold text-emerald-300 ${COMMUNITY_AVATAR_RING}`}>
      {peer.displayName.slice(0, 1).toUpperCase()}
    </span>
  );
}
