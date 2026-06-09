"use client";

import {
  IconComment,
  IconLike,
  IconShare,
} from "@/components/community/community-icons";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function CountBadge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 min-w-[14px] rounded-full bg-[#78716c] px-1 text-center text-[9px] font-bold leading-[14px] text-white">
      {formatCount(n)}
    </span>
  );
}

export function CommunityEngagementSummary({
  likeCount,
  commentCount,
  fr,
}: {
  likeCount: number;
  commentCount: number;
  fr: boolean;
}) {
  if (likeCount <= 0 && commentCount <= 0) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2 text-xs text-[#78716c]">
      {likeCount > 0 ? (
        <span className="inline-flex items-center gap-1">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#305f33] text-white">
            <IconLike size={10} filled />
          </span>
          {formatCount(likeCount)}
        </span>
      ) : (
        <span />
      )}
      {commentCount > 0 ? (
        <span>
          {formatCount(commentCount)}{" "}
          {fr
            ? commentCount > 1
              ? "commentaires"
              : "commentaire"
            : commentCount > 1
              ? "comments"
              : "comment"}
        </span>
      ) : null}
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
  const pill =
    "relative flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-[#f0f2f5] text-[#57534e] transition active:scale-[0.97]";

  return (
    <div className="flex gap-1.5 border-t border-[#f0f4f2] px-2 py-2">
      <button
        type="button"
        disabled={busy}
        onClick={onLike}
        aria-label={fr ? "J'aime" : "Like"}
        className={`${pill} ${likedByMe ? "text-[#305f33]" : ""}`}
      >
        <IconLike size={20} filled={likedByMe} />
        <CountBadge n={likeCount} />
      </button>
      <button
        type="button"
        onClick={onComment}
        aria-label={fr ? "Commenter" : "Comment"}
        className={pill}
      >
        <IconComment size={20} />
        <CountBadge n={commentCount} />
      </button>
      <button
        type="button"
        onClick={onShare}
        aria-label={fr ? "Partager" : "Share"}
        className={pill}
      >
        <IconShare size={20} />
        <CountBadge n={shareCount} />
      </button>
    </div>
  );
}
