"use client";

import { ChatAvatarBubble } from "@/components/profile/user-avatar-mark";
import { FlowInput } from "@/components/p2p/p2p-flow-ui";

export type P2pChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderMasked: string;
  senderRole: string;
  senderAvatarUrl?: string | null;
  own: boolean;
};

function ChatBubbles({
  messages,
  closedHint,
  locale,
  listRef,
  maxH,
  scrollId,
}: {
  messages: P2pChatMessage[];
  closedHint?: string;
  locale: string;
  listRef?: (el: HTMLDivElement | null) => void;
  maxH: string;
  scrollId?: string;
}) {
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  return (
    <div id={scrollId} ref={listRef} className={`space-y-2 overflow-y-auto ${maxH} px-1`}>
      {messages.length === 0 ? (
        <p className="py-4 text-center text-xs text-[color:var(--fd-muted)]">{closedHint}</p>
      ) : (
        messages.map((m) => (
          <div key={m.id} className={`flex ${m.own ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
                m.own
                  ? "rounded-br-md bg-[color:var(--fd-primary)] text-white"
                  : "rounded-bl-md border border-[color:var(--fd-border)] bg-white text-[color:var(--fd-text)]"
              }`}
            >
              <div className={`flex items-start gap-2 ${m.own ? "flex-row-reverse" : ""}`}>
                <ChatAvatarBubble
                  label={m.senderMasked}
                  avatarUrl={m.senderAvatarUrl}
                  own={m.own}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${
                      m.own ? "justify-end" : ""
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold ${
                        m.own ? "text-white/85" : "text-[color:var(--fd-muted)]"
                      }`}
                    >
                      {m.senderMasked}
                      {m.senderRole === "agent" || m.senderRole === "super_admin" ? (
                        <span className="ml-1 rounded-full bg-amber-400/30 px-1.5 py-0.5 text-[9px] uppercase">
                          Support
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`text-[9px] ${m.own ? "text-white/70" : "text-[color:var(--fd-muted)]"}`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString(loc, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">{m.body}</p>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function P2pOrderChat({
  messages,
  draft,
  onDraftChange,
  onSend,
  busy,
  canSend,
  locale,
  title,
  placeholder,
  sendLabel,
  closedHint,
  sticky,
  listRef,
}: {
  messages: P2pChatMessage[];
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  busy: boolean;
  canSend: boolean;
  locale: string;
  title: string;
  placeholder: string;
  sendLabel: string;
  closedHint?: string;
  sticky?: boolean;
  listRef?: (el: HTMLDivElement | null) => void;
}) {
  if (sticky) {
    return (
      <div
        className="fixed left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-4 bottom-[calc(4.35rem+env(safe-area-inset-bottom))]"
        aria-label={title}
      >
        <div className="fd-card overflow-hidden rounded-t-2xl p-0 shadow-[0_-6px_28px_rgba(28,25,23,0.1)]">
          <div className="border-b border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/50 px-3 py-2">
            <h2 className="text-xs font-bold text-[color:var(--fd-primary)]">{title}</h2>
          </div>
          <div className="px-2 pt-2">
            <ChatBubbles
              messages={messages}
              closedHint={closedHint}
              locale={locale}
              listRef={listRef}
              maxH="max-h-40"
              scrollId="p2p-chat-scroll"
            />
          </div>
          {canSend ? (
            <div className="flex gap-2 border-t border-[color:var(--fd-border)] p-3">
              <FlowInput
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                placeholder={placeholder}
                className="!py-2.5 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!busy && draft.trim()) onSend();
                  }
                }}
              />
              <button
                type="button"
                disabled={busy || !draft.trim()}
                onClick={onSend}
                className="fd-btn-soft shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-45"
              >
                {sendLabel}
              </button>
            </div>
          ) : (
            <p className="border-t border-[color:var(--fd-border)] px-3 py-2 text-[10px] text-[color:var(--fd-muted)]">
              {closedHint}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="fd-card p-3">
      <h2 className="text-sm font-bold text-[color:var(--fd-text)]">{title}</h2>
      <div className="mt-2">
        <ChatBubbles messages={messages} closedHint={closedHint} locale={locale} maxH="max-h-52" />
      </div>
      {canSend ? (
        <div className="mt-3 flex gap-2">
          <FlowInput
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder={placeholder}
            className="!py-2.5 text-sm"
          />
          <button
            type="button"
            disabled={busy || !draft.trim()}
            onClick={onSend}
            className="fd-btn-soft shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-45"
          >
            {sendLabel}
          </button>
        </div>
      ) : closedHint ? (
        <p className="mt-2 text-[10px] text-[color:var(--fd-muted)]">{closedHint}</p>
      ) : null}
    </section>
  );
}
