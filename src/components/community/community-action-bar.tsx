"use client";

import {
  IconComment,
  IconEye,
  IconLike,
  IconShare,
} from "@/components/community/community-icons";

function formatCount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
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

  const readLabel = fr
    ? viewCount > 1
      ? "lectures"
      : "lecture"
    : viewCount > 1
      ? "reads"
      : "read";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs font-semibold text-[#78716c]">
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
          <span
            className="inline-flex items-center gap-1"
            title={
              fr
                ? "1 lecture = 1 membre ayant ouvert la publication"
                : "1 read = 1 member who opened the post"
            }
          >
            <IconEye size={12} />
            {formatCount(viewCount)} {readLabel}
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
    "flex min-h-[44px] flex-1 items-center justify-center gap-1 rounded-lg bg-[#f0f2f5] text-sm font-bold text-[#57534e] transition active:scale-[0.97]";

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
        {likeCount > 0 ? <span>{formatCount(likeCount)}</span> : null}
      </button>
      <button
        type="button"
        onClick={onComment}
        aria-label={fr ? "Commenter" : "Comment"}
        className={pill}
      >
        <IconComment size={20} />
        {commentCount > 0 ? <span>{formatCount(commentCount)}</span> : null}
      </button>
      <button
        type="button"
        onClick={onShare}
        aria-label={fr ? "Partager" : "Share"}
        className={pill}
      >
        <IconShare size={20} />
        {shareCount > 0 ? <span>{formatCount(shareCount)}</span> : null}
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
