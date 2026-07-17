"use client";

import {
  IconBoost,
  IconBp,
  IconComment,
  IconEye,
  IconLike,
  IconMcB,
  IconShare,
} from "@/components/community/community-icons";
import { formatCompactCount } from "@/lib/community/format-count";
import { COMMUNITY_ACTION_PILL } from "@/lib/community/community-ui";

/** Visible boost brand mark — same language as profile badges. */
export function CommunityBoostBadge({ fr }: { fr: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#f0f4f2] bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-800 shadow-sm">
      <IconBoost size={10} />
      {fr ? "Boosté" : "Boosted"}
    </span>
  );
}

/** Public tip totals — SVG + chiffre en ligne, sans superposition. */
export function CommunityTipTotals({
  tipBpTotal = 0,
  tipMcbTotal = 0,
}: {
  tipBpTotal?: number;
  tipMcbTotal?: number;
  fr?: boolean;
}) {
  const bp = Math.max(0, Math.floor(tipBpTotal));
  const mcb = Math.max(0, Number(tipMcbTotal) || 0);
  if (bp <= 0 && mcb <= 0) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-1.5">
      {bp > 0 ? (
        <span className="inline-flex items-center gap-1 text-[12px] font-bold tabular-nums text-[#305f33]">
          <IconBp size={15} />
          {formatCompactCount(bp)}
        </span>
      ) : null}
      {mcb > 0 ? (
        <span className="inline-flex items-center gap-1 text-[12px] font-bold tabular-nums text-[#991b1b]">
          <IconMcB size={15} />
          {formatCompactCount(Math.floor(mcb))}
        </span>
      ) : null}
    </div>
  );
}

/** Views only: eye + compact number (no "reads" label). */
export function CommunityViewsCount({
  viewCount,
}: {
  viewCount: number;
}) {
  if (viewCount <= 0) return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-4 py-1.5 text-[11px] font-semibold tabular-nums text-[#a8a29e]"
      title={String(viewCount)}
    >
      <IconEye size={13} />
      {formatCompactCount(viewCount)}
    </span>
  );
}

/** @deprecated Prefer CommunityViewsCount - kept for media detail. */
export function CommunityEngagementSummary({
  viewCount,
}: {
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  viewCount: number;
  fr?: boolean;
  alwaysShowViews?: boolean;
}) {
  return (
    <div className="flex justify-end border-t border-[#edf2ef]">
      <CommunityViewsCount viewCount={viewCount} />
    </div>
  );
}

export function CommunityActionBar({
  fr,
  likeCount,
  commentCount,
  shareCount,
  likedByMe,
  busy,
  onLike,
  onComment,
  onShare,
}: {
  fr: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
  busy?: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}) {
  return (
    <div className="flex gap-1.5 border-t border-[#edf2ef] bg-white/80 px-2.5 py-2 backdrop-blur-sm">
      <button
        type="button"
        disabled={busy}
        onClick={onLike}
        aria-label={fr ? "J'aime" : "Like"}
        className={`${COMMUNITY_ACTION_PILL} ${
          likedByMe
            ? "bg-[#eaf5ee] text-[#305f33] ring-1 ring-[#305f33]/20"
            : ""
        }`}
      >
        <IconLike size={20} filled={likedByMe} />
        {likeCount > 0 ? (
          <span className="tabular-nums">{formatCompactCount(likeCount)}</span>
        ) : null}
      </button>
      <button
        type="button"
        onClick={onComment}
        aria-label={fr ? "Commenter" : "Comment"}
        className={COMMUNITY_ACTION_PILL}
      >
        <IconComment size={20} />
        {commentCount > 0 ? (
          <span className="tabular-nums">{formatCompactCount(commentCount)}</span>
        ) : null}
      </button>
      <button
        type="button"
        onClick={onShare}
        aria-label={fr ? "Partager" : "Share"}
        className={COMMUNITY_ACTION_PILL}
      >
        <IconShare size={20} />
        {shareCount > 0 ? (
          <span className="tabular-nums">{formatCompactCount(shareCount)}</span>
        ) : null}
      </button>
    </div>
  );
}
