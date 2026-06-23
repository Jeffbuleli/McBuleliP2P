"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityPostCard } from "@/components/community/community-post-card";
import {
  CommunityEmptyState,
  EmptyNewsIllustration,
} from "@/components/community/community-empty-illustrations";
import { CommunityFeedSkeleton } from "@/components/community/community-skeleton";
import { useCommunityPaginatedLoad } from "@/hooks/use-community-paginated-load";
import type { FeedPostView } from "@/lib/community/feed-service";
import type { CommunitySearchHit } from "@/lib/community/search-service";

function hitToPost(hit: CommunitySearchHit): FeedPostView {
  return {
    id: hit.id,
    body: hit.body,
    postType: hit.postType,
    contentKind: hit.contentKind ?? "news",
    likeCount: hit.likeCount,
    commentCount: hit.commentCount,
    shareCount: hit.shareCount,
    viewCount: hit.viewCount,
    publishedAt: hit.publishedAt,
    author: hit.author,
    media: hit.media,
    likedByMe: false,
  };
}

export function CommunityTagClient({ tag }: { tag: string }) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const normalized = tag.trim().toLowerCase().replace(/^#/, "");

  const loadPage = useCallback(
    async (cursor: string | null) => {
      const q = new URLSearchParams({ limit: "15" });
      if (cursor) q.set("cursor", cursor);
      const res = await fetch(
        `/api/community/tags/${encodeURIComponent(normalized)}/posts?${q}`,
      );
      const j = await res.json();
      return {
        items: (j.hits ?? []) as CommunitySearchHit[],
        nextCursor: (j.nextCursor as string | null) ?? null,
      };
    },
    [normalized],
  );

  const { items, loading, done, sentinelRef } =
    useCommunityPaginatedLoad<CommunitySearchHit>({
      loadPage,
      resetKey: normalized,
    });

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-3">
      <header className="mb-4">
        <Link
          href="/app/community"
          className="mb-2 inline-block text-xs font-semibold text-[#305f33]"
        >
          ← {fr ? "Community" : "Community"}
        </Link>
        <h1 className="text-lg font-bold text-[#0c0a09]">#{normalized}</h1>
        <p className="mt-1 text-sm text-[#78716c]">
          {fr
            ? "Publications contenant ce hashtag"
            : "Posts containing this hashtag"}
        </p>
      </header>

      {loading && items.length === 0 ? (
        <CommunityFeedSkeleton rows={4} />
      ) : !loading && items.length === 0 ? (
        <CommunityEmptyState
          illustration={<EmptyNewsIllustration />}
          title={fr ? "Aucune publication" : "No posts yet"}
          body={
            fr
              ? `Aucun post avec #${normalized} pour le moment.`
              : `No posts with #${normalized} yet.`
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((hit) => (
            <CommunityPostCard
              key={hit.id}
              post={hitToPost(hit)}
              onUpdate={() => {}}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="py-6 text-center text-xs text-[#a8a29e]">
        {loading ? "…" : done && items.length > 0 ? (fr ? "Fin" : "End") : ""}
      </div>
    </div>
  );
}
