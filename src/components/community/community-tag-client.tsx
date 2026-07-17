"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
import {
  isUtilityTag,
  utilityTagHashtag,
  utilityTagLabel,
} from "@/lib/community/utility-tags";

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
  const searchParams = useSearchParams();
  const authorHandle = (searchParams.get("author") ?? "").trim().replace(/^@/, "");
  const normalized = tag.trim().toLowerCase().replace(/^#/, "");
  const isUtility = isUtilityTag(normalized);
  const title = isUtility
    ? utilityTagHashtag(normalized, fr)
    : `#${normalized}`;
  const subtitle = isUtility
    ? fr
      ? authorHandle
        ? `Publications « ${utilityTagLabel(normalized, fr)} » de @${authorHandle}`
        : `Publications marquées ${utilityTagLabel(normalized, fr)}`
      : authorHandle
        ? `${utilityTagLabel(normalized, false)} posts by @${authorHandle}`
        : `Posts tagged ${utilityTagLabel(normalized, false)}`
    : fr
      ? "Publications contenant ce hashtag"
      : "Posts containing this hashtag";

  const loadPage = useCallback(
    async (cursor: string | null) => {
      if (isUtility && authorHandle) {
        const q = new URLSearchParams({
          limit: "15",
          utilityTag: normalized,
        });
        if (cursor) q.set("cursor", cursor);
        const res = await fetch(
          `/api/community/profiles/${encodeURIComponent(authorHandle)}/posts?${q}`,
        );
        const j = await res.json();
        return {
          items: (j.posts ?? []) as FeedPostView[],
          nextCursor: (j.nextCursor as string | null) ?? null,
        };
      }

      if (isUtility) {
        const q = new URLSearchParams({
          limit: "15",
          sort: "recent",
          utilityTag: normalized,
        });
        if (cursor) q.set("cursor", cursor);
        const res = await fetch(`/api/community/feed?${q}`);
        const j = await res.json();
        return {
          items: (j.posts ?? []) as FeedPostView[],
          nextCursor: (j.nextCursor as string | null) ?? null,
        };
      }

      const q = new URLSearchParams({ limit: "15" });
      if (cursor) q.set("cursor", cursor);
      const res = await fetch(
        `/api/community/tags/${encodeURIComponent(normalized)}/posts?${q}`,
      );
      const j = await res.json();
      return {
        items: ((j.hits ?? []) as CommunitySearchHit[]).map(hitToPost),
        nextCursor: (j.nextCursor as string | null) ?? null,
      };
    },
    [authorHandle, isUtility, normalized],
  );

  const resetKey = useMemo(
    () => `${normalized}:${authorHandle}:${isUtility ? "u" : "h"}`,
    [authorHandle, isUtility, normalized],
  );

  const { items, loading, done, sentinelRef } =
    useCommunityPaginatedLoad<FeedPostView>({
      loadPage,
      resetKey,
    });

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-4 pt-3">
      <header className="mb-4">
        <Link
          href={
            authorHandle
              ? `/app/community/u/${encodeURIComponent(authorHandle)}`
              : "/app/community"
          }
          className="mb-2 inline-block text-xs font-semibold text-[#305f33]"
        >
          ← {authorHandle ? `@${authorHandle}` : fr ? "Communauté" : "Community"}
        </Link>
        <h1 className="text-lg font-bold text-[#0c0a09]">{title}</h1>
        <p className="mt-1 text-sm text-[#78716c]">{subtitle}</p>
      </header>

      {loading && items.length === 0 ? (
        <CommunityFeedSkeleton rows={4} />
      ) : !loading && items.length === 0 ? (
        <CommunityEmptyState
          illustration={<EmptyNewsIllustration />}
          title={fr ? "Aucune publication" : "No posts yet"}
          body={
            fr
              ? `Aucun post pour ${title} pour le moment.`
              : `No posts for ${title} yet.`
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              onUpdate={() => {}}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-8" />
      {!done && items.length > 0 ? (
        <p className="py-4 text-center text-xs text-[#a8a29e]">…</p>
      ) : null}
    </div>
  );
}
