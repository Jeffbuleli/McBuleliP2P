"use client";

import { useState } from "react";
import { IconPlay } from "@/components/community/community-icons";
import { IconExternalLink } from "@/components/community/community-inline-icons";
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
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#292524] to-[#0c0a09]" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/35">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55 ring-2 ring-white/30">
          <IconPlay size={40} />
        </span>
      </div>
      <span className="absolute left-3 top-3 rounded-md bg-black/65 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
        {embed.label}
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
              src={
                embed.kind === "youtube"
                  ? `${embed.embedUrl}${embed.embedUrl.includes("?") ? "&" : "?"}autoplay=1`
                  : embed.embedUrl
              }
              title={embed.label}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
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
            className="inline-flex items-center gap-1 font-semibold text-[#305f33]"
            onClick={(e) => e.stopPropagation()}
          >
            <IconExternalLink className="h-3.5 w-3.5" />
            {fr ? "Ouvrir" : "Open"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <a
      href={embed.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex items-center gap-3 rounded-xl border border-[#f0f4f2] bg-[#fafaf9] px-4 py-3 text-[#44403c] active:scale-[0.99]"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f3ee] text-[#305f33]">
        <IconExternalLink className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold">{embed.label}</p>
        <p className="truncate text-xs text-[#78716c]">{embed.externalUrl}</p>
      </div>
    </a>
  );
}
