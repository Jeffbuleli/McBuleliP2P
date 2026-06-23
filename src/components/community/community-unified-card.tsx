"use client";

import Link from "next/link";
import { CommunityAuthorHeader } from "@/components/community/community-author-header";
import { CommunityFormationCard } from "@/components/community/community-formation-card";
import { CommunityExpandableText } from "@/components/community/community-expandable-text";
import { IconEye, IconGlobe } from "@/components/community/community-icons";
import { CommunityPostMedia } from "@/components/community/community-post-media";
import { CommunityPostTypeChip } from "@/components/community/community-post-type-chip";
import { postDisplayText } from "@/lib/community/link-embed";
import type { UnifiedFeedItem } from "@/lib/community/unified-feed-service";

function formatCount(n: number): string {
  if (n >= 10_000) return `${Math.round(n / 1000)} K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")} K`;
  return String(n);
}

export function CommunityUnifiedCard({
  item,
  fr,
}: {
  item: UnifiedFeedItem;
  fr: boolean;
}) {
  const postType =
    item.kind === "news" && item.media[0]?.fileType === "video"
      ? "video"
      : item.media.length
        ? "image"
        : "text";

  if (item.kind === "formation" && item.formationMeta) {
    return (
      <article className="overflow-hidden rounded-2xl border border-[#f0f4f2] bg-white shadow-[0_2px_12px_rgba(12,10,9,0.04)]">
        <div className="p-4">
          <CommunityFormationCard
            meta={item.formationMeta}
            fr={fr}
            isLive={item.formationMeta.eventStatus === "LIVE"}
          />
        </div>
      </article>
    );
  }

  const displayBody = postDisplayText(item.body, {
    hasMedia: item.media.length > 0,
  });

  return (
    <article className="overflow-hidden rounded-2xl border border-[#f0f4f2] bg-white shadow-[0_2px_12px_rgba(12,10,9,0.04)] transition active:scale-[0.995]">
      <div className="px-4 pt-4">
        <Link href={item.href} className="block">
          <div className="mb-3 flex items-start justify-between gap-2">
            <CommunityAuthorHeader
              author={item.author}
              publishedAt={item.publishedAt}
              fr={fr}
            />
            <div className="flex shrink-0 flex-col items-end gap-1">
              <CommunityPostTypeChip kind={item.kind} fr={fr} />
              <span className="inline-flex items-center gap-0.5 text-[10px] text-[#a8a29e]">
                <IconGlobe size={11} />
                {fr ? "Public" : "Public"}
              </span>
            </div>
          </div>

          {item.title ? (
            <h3 className="mb-1 text-[15px] font-bold leading-snug text-[#0c0a09]">
              {item.title}
            </h3>
          ) : null}

          {displayBody.length > 0 ? (
            <CommunityExpandableText
              text={displayBody}
              fr={fr}
              maxChars={item.title ? 120 : 180}
              className="text-sm leading-relaxed text-[#44403c]"
            />
          ) : null}
        </Link>

        <CommunityPostMedia
          media={item.media}
          postType={postType}
          body={item.body}
          fr={fr}
        />
      </div>

      {(item.likeCount > 0 ||
        item.commentCount > 0 ||
        item.shareCount > 0 ||
        item.viewCount > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs font-semibold text-[#78716c]">
          <div className="flex gap-2">
            {item.likeCount > 0 ? (
              <span>
                {formatCount(item.likeCount)} {fr ? "J'aime" : "likes"}
              </span>
            ) : null}
            {item.viewCount > 0 ? (
              <span className="inline-flex items-center gap-0.5">
                <IconEye size={12} />
                {formatCount(item.viewCount)}
              </span>
            ) : null}
          </div>
          <div className="flex gap-2">
            {item.commentCount > 0 ? (
              <span>
                {formatCount(item.commentCount)}{" "}
                {fr ? "commentaires" : "comments"}
              </span>
            ) : null}
            {item.shareCount > 0 ? (
              <span>
                {formatCount(item.shareCount)} {fr ? "partages" : "shares"}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
}
