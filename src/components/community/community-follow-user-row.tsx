"use client";

import Link from "next/link";
import { CommunityAvatar } from "@/components/community/community-avatar";
import type { FollowDiscoverReason, FollowGraphPerson } from "@/lib/community/follows-service";

function reasonLabel(reason: FollowDiscoverReason | null, fr: boolean): string | null {
  if (!reason) return null;
  if (reason === "mutual") return fr ? "Vous suit" : "Follows you";
  if (reason === "nearby") return fr ? "Près de vous" : "Near you";
  if (reason === "active") return fr ? "Actif·ve" : "Active";
  return fr ? "En hausse" : "Rising";
}

export function CommunityFollowUserRow({
  fr,
  person,
  busy,
  onToggleFollow,
  hideFollow,
}: {
  fr: boolean;
  person: FollowGraphPerson;
  busy?: boolean;
  onToggleFollow?: () => void;
  hideFollow?: boolean;
}) {
  const hint = reasonLabel(person.reason, fr);
  const profileHref = `/app/community/u/${person.handle}`;

  return (
    <div className="flex items-center gap-3 px-1 py-2.5">
      <Link href={profileHref} className="shrink-0">
        <CommunityAvatar
          label={person.displayName}
          avatarUrl={person.avatarUrl}
          sizeClass="h-11 w-11"
          className="ring-2 ring-[#e8f3ee]"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            href={profileHref}
            className="truncate text-sm font-bold text-[#0c0a09] hover:underline"
          >
            {person.displayName}
          </Link>
          {person.showKycBadge ? (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              className="shrink-0 text-[#305f33]"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
              <path
                d="M8 12l3 3 5-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          ) : null}
          {person.verifiedBlue ? (
            <span className="shrink-0 text-[10px] font-bold text-[#2563eb]">✓</span>
          ) : null}
        </div>
        <p className="truncate text-[11px] text-[#78716c]">@{person.handle}</p>
        {hint ? (
          <p className="mt-0.5 text-[10px] font-semibold text-[#305f33]">{hint}</p>
        ) : person.followsYou && !person.isFollowing ? (
          <p className="mt-0.5 text-[10px] font-semibold text-[#78716c]">
            {fr ? "Vous suit" : "Follows you"}
          </p>
        ) : null}
      </div>

      {!hideFollow && onToggleFollow && !person.isSelf ? (
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFollow();
          }}
          className={`min-h-[36px] shrink-0 rounded-xl px-3.5 text-[11px] font-bold active:scale-[0.98] disabled:opacity-50 ${
            person.isFollowing
              ? "border border-[#d6d3d1] bg-white text-[#57534e]"
              : "bg-[#305f33] text-white shadow-sm"
          }`}
        >
          {person.isFollowing
            ? fr
              ? "Abonné"
              : "Following"
            : person.followsYou
              ? fr
                ? "Suivre aussi"
                : "Follow back"
              : fr
                ? "Suivre"
                : "Follow"}
        </button>
      ) : person.isSelf ? (
        <span className="shrink-0 rounded-lg bg-[#f0f4f2] px-2.5 py-1 text-[10px] font-bold text-[#78716c]">
          {fr ? "Toi" : "You"}
        </span>
      ) : null}
    </div>
  );
}
