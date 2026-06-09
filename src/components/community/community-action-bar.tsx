"use client";

import {
  IconComment,
  IconEye,
  IconLike,
  IconShare,
} from "@/components/community/community-icons";

function formatCount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} M`;
  }
  if (n >= 10_000) return `${Math.round(n / 1000)} K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")} K`;
  return String(n);
}

export function CommunityEngagementSummary({
  likeCount,
  commentCount,
  shareCount,
  viewCount,
  fr,
}: {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  fr: boolean;
}) {
  if (
    likeCount <= 0 &&
    commentCount <= 0 &&
    shareCount <= 0 &&
    viewCount <= 0
  ) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-[#78716c]">
      <div className="flex flex-wrap items-center gap-2">
        {likeCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#305f33] text-white">
              <IconLike size={10} filled />
            </span>
            {formatCount(likeCount)}
          </span>
        ) : null}
        {viewCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <IconEye size={12} />
            {formatCount(viewCount)}{" "}
            {fr ? (viewCount > 1 ? "vues" : "vue") : viewCount > 1 ? "views" : "view"}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
        {shareCount > 0 ? (
          <span>
            {formatCount(shareCount)}{" "}
            {fr
              ? shareCount > 1
                ? "partages"
                : "partage"
              : shareCount > 1
                ? "shares"
                : "share"}
          </span>
        ) : null}
      </div>
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
  onTelegramShare,
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
  onTelegramShare?: () => void;
}) {
  const pill =
    "flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#f0f2f5] text-xs font-semibold text-[#57534e] transition active:scale-[0.97]";

  return (
    <div className="flex gap-1.5 border-t border-[#f0f4f2] px-2 py-2">
      <button
        type="button"
        disabled={busy}
        onClick={onLike}
        className={`${pill} ${likedByMe ? "text-[#305f33]" : ""}`}
      >
        <IconLike size={18} filled={likedByMe} />
        <span>{fr ? "J'aime" : "Like"}</span>
        {likeCount > 0 ? (
          <span className="font-bold">{formatCount(likeCount)}</span>
        ) : null}
      </button>
      <button type="button" onClick={onComment} className={pill}>
        <IconComment size={18} />
        <span>{fr ? "Commenter" : "Comment"}</span>
        {commentCount > 0 ? (
          <span className="font-bold">{formatCount(commentCount)}</span>
        ) : null}
      </button>
      <button type="button" onClick={onShare} className={pill}>
        <IconShare size={18} />
        <span>{fr ? "Partager" : "Share"}</span>
        {shareCount > 0 ? (
          <span className="font-bold">{formatCount(shareCount)}</span>
        ) : null}
      </button>
      {onTelegramShare ? (
        <button
          type="button"
          onClick={onTelegramShare}
          aria-label="Telegram"
          className="flex min-h-[44px] w-11 shrink-0 items-center justify-center rounded-lg bg-[#e8f6fc] text-[#229ed9] active:scale-[0.97]"
        >
          <span className="text-base font-bold">✈</span>
        </button>
      ) : null}
    </div>
  );
}
