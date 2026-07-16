"use client";

import { useState } from "react";
import { IconPlay } from "@/components/community/community-icons";
import {
  IconExternalLink,
  IconPaperPlane,
} from "@/components/community/community-inline-icons";
import type { ParsedEmbed } from "@/lib/community/link-embed";

function EmbedPreview({
  embed,
  fr,
  onPlay,
}: {
  embed: ParsedEmbed;
  fr: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      className="group relative aspect-video w-full overflow-hidden bg-[#1c1917]"
      onClick={(e) => {
        e.stopPropagation();
        onPlay();
      }}
      aria-label={fr ? `Lire ${embed.label}` : `Play ${embed.label}`}
    >
      {embed.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={embed.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover transition group-active:scale-[1.02]"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#292524] via-[#1c1917] to-[#0c0a09]" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/35 transition group-active:bg-black/25">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55 shadow-lg ring-2 ring-white/30 backdrop-blur-sm">
          <IconPlay size={40} />
        </span>
      </div>
      <span className="absolute left-3 top-3 rounded-md bg-black/65 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
        {embed.label}
      </span>
      <span className="absolute bottom-3 right-3 rounded-md bg-black/65 px-2 py-1 text-[10px] font-semibold text-white/90">
        {fr ? "Appuyer pour lire" : "Tap to play"}
      </span>
    </button>
  );
}

export function CommunityLinkEmbed({
  embed,
  fr,
}: {
  embed: ParsedEmbed;
  fr: boolean;
}) {
  const [playing, setPlaying] = useState(false);

  if (embed.embedUrl) {
    return (
      <div
        className="mt-3 overflow-hidden rounded-xl border border-[#f0f4f2] bg-[#fafaf9]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {playing ? (
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={embed.embedUrl}
              title={embed.label}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <EmbedPreview embed={embed} fr={fr} onPlay={() => setPlaying(true)} />
        )}
        <div className="flex items-center justify-between border-t border-[#f0f4f2] px-3 py-2 text-[11px] text-[#57534e]">
          <span className="font-semibold">{embed.label}</span>
          <a
            href={embed.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#305f33]"
            onClick={(e) => e.stopPropagation()}
          >
            {fr ? "Ouvrir" : "Open"}
          </a>
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
        {isTelegram ? (
          <IconPaperPlane className="h-5 w-5" />
        ) : (
          <IconExternalLink className="h-5 w-5" />
        )}
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
