"use client";

import {
  IconComment,
  IconLike,
  IconShare,
} from "@/components/community/community-icons";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} M`;
  if (n >= 10_000) return `${Math.round(n / 1000)} K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")} K`;
  return String(n);
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
    "flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#f0f2f5] text-xs font-semibold text-[#57534e] transition active:scale-[0.97]";

  return (
    <div className="flex gap-1.5 border-t border-[#f0f4f2] px-2 py-2">
      <button
        type="button"
        disabled={busy}
        onClick={onLike}
        className={`${pill} ${likedByMe ? "text-[#305f33]" : ""}`}
      >
        <IconLike size={16} filled={likedByMe} />
        <span>{fr ? "J'aime" : "Like"}</span>
        {likeCount > 0 ? <span>{formatCount(likeCount)}</span> : null}
      </button>
      <button type="button" onClick={onComment} className={pill}>
        <IconComment size={16} />
        <span>{fr ? "Commenter" : "Comment"}</span>
        {commentCount > 0 ? <span>{formatCount(commentCount)}</span> : null}
      </button>
      <button type="button" onClick={onShare} className={pill}>
        <IconShare size={16} />
        <span>{fr ? "Partager" : "Share"}</span>
        {shareCount > 0 ? <span>{formatCount(shareCount)}</span> : null}
      </button>
    </div>
  );
}
