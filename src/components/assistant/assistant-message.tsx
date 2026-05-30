"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { AssistantLocale } from "@/lib/assistant/messages";
import { getAssistantMessages } from "@/lib/assistant/messages";

function renderMarkdownLite(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function AssistantMessageBubble({
  role,
  content,
  locale,
}: {
  role: "user" | "assistant";
  content: string;
  locale: AssistantLocale;
}) {
  const isUser = role === "user";
  const m = getAssistantMessages(locale);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser ? (
        <div className="mt-1 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#305f33] to-[#1e3d21] text-[10px] font-bold text-white">
            AI
          </div>
        </div>
      ) : null}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
          isUser
            ? "rounded-br-md bg-[#305f33] text-white shadow-md shadow-[#305f33]/25"
            : "rounded-bl-md border border-white/10 bg-white/8 text-stone-100 backdrop-blur-sm"
        }`}
      >
        {isUser ? content : renderMarkdownLite(content)}
        {!isUser && content.length > 20 ? (
          <p className="mt-1.5 text-[10px] text-stone-400">{m.name}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

export function AssistantTypingIndicator({ locale }: { locale: AssistantLocale }) {
  const m = getAssistantMessages(locale);
  return (
    <div className="flex items-center gap-2 px-1 py-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#305f33]/80 text-[10px] font-bold text-white">
        AI
      </div>
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

export function AssistantRecommendations({
  items,
}: {
  items: { label: string; href: string; reason: string }[];
}) {
  if (!items.length) return null;
  return (
    <div className="mt-2 space-y-1.5 px-1">
      {items.map((r) => (
        <Link
          key={r.href}
          href={r.href}
          className="block rounded-xl border border-[#305f33]/30 bg-[#305f33]/10 px-3 py-2 transition hover:bg-[#305f33]/20"
        >
          <p className="text-xs font-bold text-[#6ee7a0]">{r.label}</p>
          <p className="text-[11px] text-stone-400">{r.reason}</p>
        </Link>
      ))}
    </div>
  );
}
