"use client";

import Link from "next/link";
import { CommunityAuthorHeader } from "@/components/community/community-author-header";
import { CommunityExpandableText } from "@/components/community/community-expandable-text";
import { IconGlobe } from "@/components/community/community-icons";
import { CommunityPostMedia } from "@/components/community/community-post-media";
import { CommunityPostTypeChip } from "@/components/community/community-post-type-chip";
import type { UnifiedFeedItem } from "@/lib/community/unified-feed-service";

function formatCount(n: number): string {
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

  return (
    <Link
      href={item.href}
      className="block overflow-hidden rounded-2xl border border-[#f0f4f2] bg-white shadow-[0_2px_12px_rgba(12,10,9,0.04)] transition active:scale-[0.995]"
    >
      <div className="px-4 pt-4">
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

        <CommunityExpandableText
          text={item.body}
          fr={fr}
          maxChars={item.title ? 120 : 180}
          className="text-sm leading-relaxed text-[#44403c]"
        />

        <CommunityPostMedia media={item.media} postType={postType} fr={fr} />
      </div>

      {(item.likeCount > 0 || item.commentCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-[#78716c]">
          {item.likeCount > 0 ? (
            <span>{formatCount(item.likeCount)} {fr ? "J'aime" : "likes"}</span>
          ) : (
            <span />
          )}
          {item.commentCount > 0 ? (
            <span>
              {formatCount(item.commentCount)}{" "}
              {fr ? "commentaires" : "comments"}
            </span>
          ) : null}
        </div>
      )}
    </Link>
  );
}
