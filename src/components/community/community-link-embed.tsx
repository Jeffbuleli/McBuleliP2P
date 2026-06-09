"use client";

import type { ParsedEmbed } from "@/lib/community/link-embed";

export function CommunityLinkEmbed({
  embed,
  fr,
}: {
  embed: ParsedEmbed;
  fr: boolean;
}) {
  if (embed.embedUrl) {
    return (
      <div
        className="mt-3 overflow-hidden rounded-xl border border-[#f0f4f2] bg-[#fafaf9]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#f0f4f2] px-3 py-2 text-[11px] font-semibold text-[#57534e]">
          <span>{embed.label}</span>
          <a
            href={embed.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#305f33]"
            onClick={(e) => e.stopPropagation()}
          >
            {fr ? "Ouvrir" : "Open"}
          </a>
        </div>
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={embed.embedUrl}
            title={embed.label}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  const isTelegram = embed.kind === "telegram";

  return (
    <a
      href={embed.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-3 flex items-center gap-3 rounded-xl border px-4 py-3 active:scale-[0.99] ${
        isTelegram
          ? "border-[#229ed9]/30 bg-[#e8f6fc] text-[#0c4a6e]"
          : "border-[#f0f4f2] bg-[#fafaf9] text-[#44403c]"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
          isTelegram ? "bg-[#229ed9] text-white" : "bg-[#e8f3ee] text-[#305f33]"
        }`}
      >
        {isTelegram ? "✈" : "↗"}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold">
          {isTelegram
            ? fr
              ? "Canal Telegram"
              : "Telegram channel"
            : embed.label}
        </p>
        <p className="truncate text-xs opacity-80">{embed.externalUrl}</p>
      </div>
    </a>
  );
}
