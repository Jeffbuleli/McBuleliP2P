"use client";

import {
  IconComment,
  IconEye,
  IconLike,
  IconShare,
  IconTelegram,
} from "@/components/community/community-icons";
import {
  COMMUNITY_ACTION_BAR_WRAP,
  COMMUNITY_ACTION_PILL,
  COMMUNITY_ACTION_PILL_ACTIVE,
  COMMUNITY_ENGAGEMENT_BAR,
  COMMUNITY_ENGAGEMENT_PILL,
  COMMUNITY_ENGAGEMENT_PILL_LIKE,
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
    <div className={COMMUNITY_ENGAGEMENT_BAR}>
      <div className="flex flex-wrap items-center gap-2.5">
        {likeCount > 0 ? (
          <span className={COMMUNITY_ENGAGEMENT_PILL_LIKE}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/25 text-emerald-300">
              <IconLike size={11} filled />
            </span>
            {formatCount(likeCount)}
          </span>
        ) : null}
        {showViews ? (
          <span
            className={COMMUNITY_ENGAGEMENT_PILL}
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
          <span className={COMMUNITY_ENGAGEMENT_PILL}>
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
          <span className={COMMUNITY_ENGAGEMENT_PILL}>
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
    <div className={COMMUNITY_ACTION_BAR_WRAP}>
      <button
        type="button"
        disabled={busy}
        onClick={onLike}
        aria-label={fr ? "J'aime" : "Like"}
        className={likedByMe ? COMMUNITY_ACTION_PILL_ACTIVE : COMMUNITY_ACTION_PILL}
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
          className="flex min-h-[44px] w-11 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10 text-sky-300 active:scale-[0.97]"
        >
          <IconTelegram size={20} />
        </button>
      ) : null}
    </div>
  );
}
