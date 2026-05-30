"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/components/i18n-provider";
import { AssistantAvatar } from "@/components/assistant/assistant-avatar";
import {
  AssistantMessageBubble,
  AssistantRecommendations,
  AssistantTypingIndicator,
} from "@/components/assistant/assistant-message";
import {
  QUICK_ACTION_KEYS,
  getAssistantMessages,
  quickActionLabel,
  quickActionPrompt,
  resolveAssistantLocale,
  type AssistantLocale,
  type QuickActionKey,
} from "@/lib/assistant/messages";
import { detectPageContext } from "@/lib/assistant/page-context";

const STORAGE_KEY = "mcbuleli_ai_conversation";
const GUEST_KEY = "mcbuleli_ai_guest";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: Record<string, unknown> | null;
};

type Recommendation = { label: string; href: string; reason: string };

export function AssistantWidget() {
  const pathname = usePathname();
  const { locale: appLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const [assistantLocale, setAssistantLocale] = useState<AssistantLocale>("en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [idlePulse, setIdlePulse] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const m = getAssistantMessages(assistantLocale);
  const pageContext = detectPageContext(pathname ?? "/");

  useEffect(() => {
    setAssistantLocale(resolveAssistantLocale(appLocale));
  }, [appLocale]);

  const scrollBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  const loadConversation = useCallback(async () => {
    setBooting(true);
    setError(null);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedGuest = localStorage.getItem(GUEST_KEY);
      const params = new URLSearchParams({
        locale: assistantLocale,
        ...(stored ? { conversationId: stored } : {}),
        ...(storedGuest ? { guestToken: storedGuest } : {}),
        ...(pageContext ? { pageContext } : {}),
      });
      const res = await fetch(`/api/assistant/conversation?${params}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      if (data.conversation?.id) {
        setConversationId(data.conversation.id);
        localStorage.setItem(STORAGE_KEY, data.conversation.id);
      }
      if (data.guestToken) {
        setGuestToken(data.guestToken);
        localStorage.setItem(GUEST_KEY, data.guestToken);
      }
      setMessages(
        (data.messages as ChatMessage[] | undefined)?.filter(
          (msg) => msg.role === "user" || msg.role === "assistant",
        ) ?? [],
      );
    } catch {
      setError(m.errorGeneric);
    } finally {
      setBooting(false);
    }
  }, [assistantLocale, m.errorGeneric, pageContext]);

  useEffect(() => {
    if (open) void loadConversation();
  }, [open, loadConversation]);

  useEffect(() => {
    scrollBottom();
  }, [messages, loading, scrollBottom]);

  useEffect(() => {
    const resetIdle = () => {
      setIdlePulse(false);
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
      if (!open) {
        inactivityRef.current = setTimeout(() => setIdlePulse(true), 45_000);
      }
    };
    resetIdle();
    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("touchstart", resetIdle);
    window.addEventListener("keydown", resetIdle);
    return () => {
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("touchstart", resetIdle);
      window.removeEventListener("keydown", resetIdle);
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
    };
  }, [open]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setDraft("");
    setLoading(true);
    setError(null);
    setRecommendations([]);

    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: trimmed,
          guestToken,
          locale: assistantLocale,
          pageContext,
        }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setError(m.rateLimited);
        setMessages((prev) => prev.filter((x) => x.id !== optimistic.id));
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "failed");

      if (data.conversation?.id) {
        setConversationId(data.conversation.id);
        localStorage.setItem(STORAGE_KEY, data.conversation.id);
      }
      if (data.guestToken) {
        setGuestToken(data.guestToken);
        localStorage.setItem(GUEST_KEY, data.guestToken);
      }

      setMessages((prev) => {
        const withoutTmp = prev.filter((x) => x.id !== optimistic.id);
        const next = [...withoutTmp];
        if (data.userMessage) next.push(data.userMessage);
        if (data.assistantMessage) next.push(data.assistantMessage);
        return next;
      });
      if (Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      }
    } catch {
      setError(m.errorGeneric);
      setMessages((prev) => prev.filter((x) => x.id !== optimistic.id));
    } finally {
      setLoading(false);
    }
  }

  function onQuickAction(key: QuickActionKey) {
    void sendMessage(quickActionPrompt(assistantLocale, key));
  }

  const showWelcome = messages.length === 0 && !booting;

  return (
    <>
      {/* Floating launcher */}
      <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-[9998] sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {!open ? (
            <motion.button
              type="button"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpen(true)}
              aria-label={m.openAssistant}
              className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-[#305f33] to-[#1a3520] shadow-xl shadow-[#305f33]/50 backdrop-blur-md"
            >
              <AssistantAvatar size={44} pulse={idlePulse} />
              {idlePulse ? (
                <motion.span
                  className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#6ee7a0] text-[9px] font-black text-[#1a3520]"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  ?
                </motion.span>
              ) : null}
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-end justify-end p-0 sm:p-4 sm:pb-6"
          >
            <button
              type="button"
              aria-label={m.closeAssistant}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative flex h-[min(92dvh,640px)] w-full flex-col overflow-hidden border border-white/10 bg-gradient-to-b from-[#0f1410]/95 via-[#121a14]/98 to-[#0a0e0b]/98 shadow-2xl shadow-black/60 backdrop-blur-xl sm:mb-0 sm:mr-0 sm:h-[min(82dvh,680px)] sm:max-w-[420px] sm:rounded-3xl"
            >
              {/* Glow particles */}
              <div
                className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[#305f33]/20 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-[#6ee7a0]/10 blur-3xl"
                aria-hidden
              />

              {/* Header */}
              <header className="relative flex items-center gap-3 border-b border-white/10 px-4 py-3">
                <AssistantAvatar size={36} pulse={loading} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{m.name}</p>
                  <p className="truncate text-[11px] text-[#6ee7a0]/80">{m.tagline}</p>
                </div>
                <div className="flex items-center gap-1">
                  {(["en", "fr", "sw"] as AssistantLocale[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setAssistantLocale(l)}
                      className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${
                        assistantLocale === l
                          ? "bg-[#305f33] text-white"
                          : "text-stone-400 hover:text-white"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="ml-1 rounded-xl p-2 text-stone-400 hover:bg-white/10 hover:text-white"
                    aria-label={m.closeAssistant}
                  >
                    ✕
                  </button>
                </div>
              </header>

              {/* Messages */}
              <div
                ref={listRef}
                className="relative flex-1 space-y-3 overflow-y-auto px-3 py-4"
              >
                {showWelcome ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-[#305f33]/25 bg-[#305f33]/10 p-4"
                  >
                    <p className="text-base font-bold text-white">{m.welcome}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-stone-300">
                      {m.welcomeSub}
                    </p>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[#6ee7a0]">
                      {m.quickActions}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {QUICK_ACTION_KEYS.map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => onQuickAction(key)}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-stone-200 transition hover:border-[#305f33]/50 hover:bg-[#305f33]/20"
                        >
                          {quickActionLabel(assistantLocale, key)}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : null}

                {messages.map((msg) => (
                  <AssistantMessageBubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    locale={assistantLocale}
                  />
                ))}

                {loading ? (
                  <AssistantTypingIndicator locale={assistantLocale} />
                ) : null}

                <AssistantRecommendations items={recommendations} />
              </div>

              {error ? (
                <p className="px-4 pb-1 text-center text-xs text-rose-400">{error}</p>
              ) : null}

              {/* Input */}
              <footer className="border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendMessage(draft);
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={m.placeholder}
                    disabled={loading}
                    className="min-h-[44px] flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-stone-500 focus:border-[#305f33]/60 focus:ring-2 focus:ring-[#305f33]/20"
                  />
                  <button
                    type="submit"
                    disabled={loading || !draft.trim()}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-[#305f33] px-4 text-sm font-bold text-white shadow-lg shadow-[#305f33]/30 disabled:opacity-50"
                  >
                    {m.send}
                  </button>
                </form>
                <Link
                  href="/app/support"
                  onClick={() => setOpen(false)}
                  className="mt-2 block text-center text-[11px] font-medium text-[#6ee7a0]/80 hover:text-[#6ee7a0]"
                >
                  {m.humanSupport} →
                </Link>
              </footer>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
