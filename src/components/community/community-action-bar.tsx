"use client";

import {
  IconComment,
  IconEye,
  IconLike,
  IconShare,
  IconTelegram,
} from "@/components/community/community-icons";
import {
  COMMUNITY_ACTION_PILL,
} from "@/lib/community/community-ui";

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
  alwaysShowViews = false,
}: {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  fr: boolean;
  alwaysShowViews?: boolean;
}) {
  const showViews = alwaysShowViews || viewCount > 0;

  if (
    likeCount <= 0 &&
    commentCount <= 0 &&
    shareCount <= 0 &&
    !showViews
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
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#edf2ef] bg-gradient-to-r from-[#fafcfa] to-white px-4 py-2.5 text-xs font-semibold text-[#78716c]">
      <div className="flex flex-wrap items-center gap-2.5">
        {likeCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf5ee] px-2 py-0.5 text-[#305f33]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#305f33] text-white shadow-sm">
              <IconLike size={11} filled />
            </span>
            {formatCount(likeCount)}
          </span>
        ) : null}
        {showViews ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[#f4f6f4] px-2 py-0.5"
            title={
              fr
                ? "1 lecture = 1 membre ayant vu la publication"
                : "1 read = 1 member who viewed the post"
            }
          >
            <IconEye size={13} />
            {formatCount(viewCount)} {readLabel}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {commentCount > 0 ? (
          <span className="rounded-full bg-[#f4f6f4] px-2 py-0.5">
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
          <span className="rounded-full bg-[#f4f6f4] px-2 py-0.5">
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
  return (
    <div className="flex gap-1.5 border-t border-[#edf2ef] bg-white/80 px-2.5 py-2.5 backdrop-blur-sm">
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
        {likeCount > 0 ? <span>{formatCount(likeCount)}</span> : null}
      </button>
      <button
        type="button"
        onClick={onComment}
        aria-label={fr ? "Commenter" : "Comment"}
        className={COMMUNITY_ACTION_PILL}
      >
        <IconComment size={20} />
        {commentCount > 0 ? <span>{formatCount(commentCount)}</span> : null}
      </button>
      <button
        type="button"
        onClick={onShare}
        aria-label={fr ? "Partager" : "Share"}
        className={COMMUNITY_ACTION_PILL}
      >
        <IconShare size={20} />
        {shareCount > 0 ? <span>{formatCount(shareCount)}</span> : null}
      </button>
      {onTelegramShare ? (
        <button
          type="button"
          onClick={onTelegramShare}
          aria-label="Telegram"
          className="flex min-h-[44px] w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#e8f6fc] to-[#d4edfa] text-[#229ed9] ring-1 ring-[#229ed9]/20 active:scale-[0.97]"
        >
          <IconTelegram size={20} />
        </button>
      ) : null}
    </div>
  );
}
