"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { AssistantLocale } from "@/lib/assistant/messages";
import { getAssistantMessages } from "@/lib/assistant/messages";
import { RenderAssistantMarkdown } from "@/lib/assistant/render-markdown";
import { AssistantBotLogo } from "@/components/assistant/assistant-bot-logo";

export function AssistantMessageBubble({
  role,
  content,
  locale,
  actions,
  onNavigate,
}: {
  role: "user" | "assistant";
  content: string;
  locale: AssistantLocale;
  actions?: { label: string; href: string; reason: string }[];
  onNavigate?: () => void;
}) {
  const isUser = role === "user";
  const m = getAssistantMessages(locale);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}
    >
      <div className={`flex w-full gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {!isUser ? (
          <div className="mt-0.5 shrink-0">
            <AssistantBotLogo size={28} className="h-7 w-7" />
          </div>
        ) : null}
        <div
          className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
            isUser
              ? "rounded-br-md bg-[#305f33] text-white shadow-md shadow-[#305f33]/25"
              : "rounded-bl-md border border-white/10 bg-white/8 text-stone-100 backdrop-blur-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <RenderAssistantMarkdown text={content} />
          )}
          {!isUser && content.length > 20 ? (
            <p className="mt-2 border-t border-white/10 pt-1.5 text-[10px] text-stone-400">
              {m.name}
            </p>
          ) : null}
        </div>
      </div>
      {!isUser && actions && actions.length > 0 ? (
        <AssistantActionLinks
          items={actions}
          locale={locale}
          onNavigate={onNavigate}
        />
      ) : null}
    </motion.div>
  );
}

export function AssistantTypingIndicator({ locale }: { locale: AssistantLocale }) {
  const m = getAssistantMessages(locale);
  return (
    <div className="flex items-center gap-2 px-1 py-2">
      <AssistantBotLogo size={28} className="h-7 w-7 shrink-0" />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-white/10 bg-white/8 px-3 py-2 backdrop-blur-sm">
        <span className="text-xs text-stone-400">{m.thinking}</span>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block h-1.5 w-1.5 rounded-full bg-[#6ee7a0]"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function AssistantActionLinks({
  items,
  locale,
  onNavigate,
}: {
  items: { label: string; href: string; reason: string }[];
  locale: AssistantLocale;
  onNavigate?: () => void;
}) {
  const m = getAssistantMessages(locale);
  if (!items.length) return null;
  return (
    <div className="ml-9 w-full max-w-[88%] space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6ee7a0]/90">
        {m.directAccess}
      </p>
      {items.map((r) => (
        <Link
          key={r.href}
          href={r.href}
          onClick={() => onNavigate?.()}
          className="flex items-center justify-between gap-2 rounded-xl border border-[#305f33]/40 bg-[#305f33]/15 px-3 py-2.5 transition hover:border-[#6ee7a0]/40 hover:bg-[#305f33]/25"
        >
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#6ee7a0]">{r.label}</p>
            <p className="text-[11px] text-stone-400">{r.reason}</p>
          </div>
          <span className="shrink-0 text-sm font-bold text-[#6ee7a0]">→</span>
        </Link>
      ))}
    </div>
  );
}

/** @deprecated use AssistantActionLinks per message */
export function AssistantRecommendations({
  items,
  locale,
  onNavigate,
}: {
  items: { label: string; href: string; reason: string }[];
  locale: AssistantLocale;
  onNavigate?: () => void;
}) {
  return (
    <AssistantActionLinks items={items} locale={locale} onNavigate={onNavigate} />
  );
}
