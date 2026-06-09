"use client";

import Link from "next/link";
import { CommunityAuthorHeader } from "@/components/community/community-author-header";
import { CommunityPostTypeChip } from "@/components/community/community-post-type-chip";
import { communityImageVariant } from "@/lib/community/data-saver";
import type { UnifiedFeedItem } from "@/lib/community/unified-feed-service";

export function CommunityUnifiedCard({
  item,
  fr,
}: {
  item: UnifiedFeedItem;
  fr: boolean;
}) {
  const img = item.media[0];
  const imgSrc = img ? communityImageVariant(img.variants, img.url) : null;

  return (
    <Link
      href={item.href}
      className="block rounded-2xl border border-[#f0f4f2] bg-white p-4 shadow-sm transition active:scale-[0.995]"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <CommunityAuthorHeader
          author={item.author}
          publishedAt={item.publishedAt}
          fr={fr}
        />
        <CommunityPostTypeChip kind={item.kind} fr={fr} />
      </div>

      {item.title ? (
        <h3 className="mb-1 text-sm font-bold leading-snug text-[#0c0a09]">
          {item.title}
        </h3>
      ) : null}

      <p className="max-w-prose text-sm leading-relaxed text-[#44403c] line-clamp-4 whitespace-pre-wrap">
        {item.body}
      </p>

      {imgSrc ? (
        <div className="mt-3 overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt=""
            loading="lazy"
            className="max-h-56 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="mt-3 flex gap-4 text-[11px] font-semibold text-[#78716c]">
        {item.likeCount > 0 ? (
          <span>
            {fr ? "J'aime" : "Like"} · {item.likeCount}
          </span>
        ) : null}
        {item.commentCount > 0 ? (
          <span>
            {fr ? "Commentaires" : "Comments"} · {item.commentCount}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
