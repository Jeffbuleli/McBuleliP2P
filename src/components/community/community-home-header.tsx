"use client";

import Link from "next/link";
import { CommunityHelpTrigger } from "@/components/community/community-help-sheet";
import { CommunitySearchBar } from "@/components/community/community-search-bar";
import { IconInbox, IconSparkles, IconTelegram } from "@/components/community/community-icons";

function CommunityMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <rect width="40" height="40" rx="12" fill="url(#cm-bg)" />
      <path
        d="M12 14c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v8.5c0 1.1-.9 2-2 2H18l-5 3.5V14z"
        fill="white"
        fillOpacity="0.95"
      />
      <circle cx="16" cy="19" r="1.2" fill="#305f33" />
      <circle cx="20" cy="19" r="1.2" fill="#305f33" />
      <circle cx="24" cy="19" r="1.2" fill="#305f33" />
      <defs>
        <linearGradient id="cm-bg" x1="8" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3d8f5a" />
          <stop offset="1" stopColor="#305f33" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function CommunityHomeHeader({
  fr,
  bp,
  searchLoading,
  onSearch,
  onHelpOpen,
}: {
  fr: boolean;
  bp: number | null;
  searchLoading?: boolean;
  onSearch: (q: string) => void;
  onHelpOpen: () => void;
}) {
  return (
    <div className="mb-4 overflow-hidden rounded-3xl border border-[#dce8e0] bg-gradient-to-br from-white via-[#f8fbf9] to-[#eef6f0] shadow-[0_10px_40px_rgba(48,95,51,0.08)] ring-1 ring-[#305f33]/5">
      <div className="h-1 bg-gradient-to-r from-transparent via-[#3d8f5a] to-transparent" aria-hidden />

      <div className="px-4 pb-4 pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <CommunityMark />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#3d8f5a]">
                <IconSparkles size={12} />
                McBuleli
              </p>
              <h1 className="truncate text-xl font-bold tracking-[-0.03em] text-[#0c0a09]">
                {fr ? "Communauté" : "Community"}
              </h1>
              <p className="mt-0.5 text-xs font-medium text-[#78716c]">
                {fr
                  ? "Crypto, signaux, formations & échanges"
                  : "Crypto, signals, training & discussions"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href="/app/community/inbox"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#305f33] shadow-sm ring-1 ring-[#dce8e0] transition active:scale-95"
              aria-label={fr ? "Messages" : "Inbox"}
            >
              <IconInbox size={18} />
            </Link>
            {bp !== null ? (
              <Link
                href="/app/wallet/points"
                className="flex h-10 items-center rounded-xl bg-gradient-to-br from-[#eaf5ee] to-[#d4ebe0] px-3 text-xs font-bold tabular-nums text-[#305f33] shadow-sm ring-1 ring-[#305f33]/15 transition active:scale-95"
              >
                {bp} BP
              </Link>
            ) : null}
            <CommunityHelpTrigger onClick={onHelpOpen} />
          </div>
        </div>

        <div className="mt-4">
          <CommunitySearchBar
            fr={fr}
            loading={searchLoading}
            onSearch={onSearch}
            embedded
          />
        </div>

        <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-[#229ed9]/20 bg-gradient-to-r from-[#e8f6fc] to-[#f0f9ff] px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 text-[#229ed9] shadow-sm">
            <IconTelegram size={18} />
          </span>
          <p className="text-[11px] leading-relaxed text-[#0c4a6e]">
            {fr
              ? "Influenceurs crypto : partagez Telegram, YouTube et TikTok — lecture intégrée McBuleli."
              : "Crypto creators: share Telegram, YouTube & TikTok — in-app playback on McBuleli."}
          </p>
        </div>
      </div>
    </div>
  );
}
