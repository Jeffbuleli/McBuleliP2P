"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { CommunityCategoryNav } from "@/components/community/community-category-nav";
import {
  CommunityHelpSheet,
  CommunityHelpTrigger,
} from "@/components/community/community-help-sheet";
import { CommunityPostCard } from "@/components/community/community-post-card";
import { CommunityPostComposer } from "@/components/community/community-post-composer";
import { CommunitySearchBar } from "@/components/community/community-search-bar";
import { CommunityUnifiedCard } from "@/components/community/community-unified-card";
import {
  CommunityEmptyState,
  EmptyNewsIllustration,
} from "@/components/community/community-empty-illustrations";
import { CommunityFeedSkeleton } from "@/components/community/community-skeleton";
import { useCommunityPaginatedLoad } from "@/hooks/use-community-paginated-load";
import type { FeedPostView } from "@/lib/community/feed-service";
import type { CommunityCategoryId } from "@/lib/community/nav-config";
import type { UnifiedFeedItem } from "@/lib/community/unified-feed-service";
import type { CommunitySearchHit } from "@/lib/community/search-service";
import { communityPostAppPath } from "@/lib/community/share-url";
import { IconInbox } from "@/components/community/community-icons";

function toFeedPost(item: UnifiedFeedItem): FeedPostView {
  return {
    id: item.id,
    body: item.body,
    postType:
      item.media[0]?.fileType === "video"
        ? "video"
        : item.media.length
          ? "image"
          : "text",
    contentKind: item.kind === "formation" ? "formation" : (item.meta?.contentKind ?? "news"),
    formationMeta: item.formationMeta ?? null,
    likeCount: item.likeCount,
    commentCount: item.commentCount,
    shareCount: item.shareCount,
    viewCount: item.viewCount ?? 0,
    publishedAt: item.publishedAt,
    author: item.author,
    media: item.media,
    likedByMe: item.likedByMe ?? false,
  };
}

export function CommunityHomeClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState<CommunityCategoryId>("all");
  const [bp, setBp] = useState<number | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [bpToast, setBpToast] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState<string | null>(null);
  const [searchHits, setSearchHits] = useState<CommunitySearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const legacyPost = searchParams.get("post");
    if (legacyPost) {
      router.replace(communityPostAppPath(legacyPost));
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetch("/api/rewards/me")
      .then((r) => r.json())
      .then((d: { balance?: number }) => {
        if (typeof d.balance === "number") setBp(d.balance);
      })
      .catch(() => {});
  }, []);

  const feedCategory =
    category === "all" || category === "news" || category === "trending"
      ? category === "trending"
        ? "trending"
        : category
      : category === "discussions"
        ? "discussions"
        : category === "blogs"
          ? "blogs"
          : category === "questions"
            ? "questions"
            : category === "signals"
              ? "signals"
              : "all";

  const loadPage = useCallback(
    async (cursor: string | null) => {
      const q = new URLSearchParams({ limit: "15", category: feedCategory });
      if (cursor) q.set("cursor", cursor);
      const res = await fetch(`/api/community/unified-feed?${q}`);
      const j = await res.json();
      return {
        items: (j.items ?? []) as UnifiedFeedItem[],
        nextCursor: (j.nextCursor as string | null) ?? null,
      };
    },
    [feedCategory],
  );

  const {
    items,
    setItems,
    loading,
    done,
    sentinelRef,
  } = useCommunityPaginatedLoad<UnifiedFeedItem>({
    loadPage,
    resetKey: feedCategory,
  });

  const showNewsComposer =
    category === "all" || category === "news" || category === "trending";

  const runSearch = async (q: string) => {
    setSearchLoading(true);
    setSearchQ(q);
    try {
      const res = await fetch(
        `/api/community/search?q=${encodeURIComponent(q)}&limit=20`,
      );
      const j = await res.json();
      setSearchHits((j.hits ?? []) as CommunitySearchHit[]);
    } finally {
      setSearchLoading(false);
    }
  };

  const searchToPost = (hit: CommunitySearchHit): FeedPostView => ({
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
  });

  const onPostPublished = (post: FeedPostView) => {
    const unified: UnifiedFeedItem = {
      id: post.id,
      kind: "news",
      title: null,
      body: post.body,
      publishedAt: post.publishedAt,
      author: post.author,
      href: communityPostAppPath(post.id),
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      viewCount: post.viewCount ?? 0,
      likedByMe: post.likedByMe,
      media: post.media,
      meta: { contentKind: post.contentKind },
    };
    setItems((list) => [unified, ...list]);
    if (post.bpEarned && post.bpEarned > 0) {
      setBpToast(`+${post.bpEarned} BP`);
      setTimeout(() => setBpToast(null), 2500);
    }
  };

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-3">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-[#0c0a09]">Community</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/app/community/inbox"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0f7f3] text-[#305f33]"
            aria-label={fr ? "Messages" : "Inbox"}
          >
            <IconInbox size={18} />
          </Link>
          {bp !== null ? (
            <Link
              href="/app/wallet/points"
              className="rounded-full bg-[#e8f3ee] px-2.5 py-1 text-[11px] font-bold text-[#305f33]"
            >
              {bp} BP
            </Link>
          ) : null}
          <CommunityHelpTrigger onClick={() => setHelpOpen(true)} />
        </div>
      </header>

      <CommunitySearchBar
        fr={fr}
        loading={searchLoading}
        onSearch={(q) => void runSearch(q)}
      />

      <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#229ed9]/25 bg-[#e8f6fc] px-3 py-2 text-xs text-[#0c4a6e]">
        <span className="text-base">✈</span>
        <p>
          {fr
            ? "Influenceurs crypto : partagez vos liens Telegram, YouTube et TikTok — lecture intégrée McBuleli."
            : "Crypto creators: share Telegram, YouTube & TikTok links — in-app playback on McBuleli."}
        </p>
      </div>

      <CommunityCategoryNav
        active={category}
        onChange={(c) => {
          setCategory(c);
          setSearchQ(null);
          setSearchHits([]);
        }}
        fr={fr}
      />

      {showNewsComposer ? (
        <>
          {!showComposer ? (
            <button
              type="button"
              className="mb-3 mt-3 w-full rounded-xl bg-[#305f33] py-2.5 text-sm font-bold text-white active:scale-[0.99]"
              onClick={() => setShowComposer(true)}
            >
              {fr ? "+ Publier" : "+ Publish"}
            </button>
          ) : null}
          <CommunityPostComposer
            fr={fr}
            open={showComposer}
            onClose={() => setShowComposer(false)}
            onPublished={onPostPublished}
          />
        </>
      ) : null}

      {loading && items.length === 0 ? (
        <CommunityFeedSkeleton rows={4} />
      ) : !loading && items.length === 0 ? (
        <CommunityEmptyState
          illustration={<EmptyNewsIllustration />}
          title={fr ? "Aucune publication" : "No posts yet"}
          body={
            fr
              ? "Soyez le premier à partager avec la communauté."
              : "Be the first to share with the community."
          }
        />
      ) : !searchQ ? (
        <div className="space-y-4">
          {items.map((item) =>
            item.kind === "news" || item.kind === "formation" ? (
              <CommunityPostCard
                key={`post-${item.id}`}
                post={toFeedPost(item)}
                onUpdate={(patch) => {
                  setItems((list) =>
                    list.map((i) =>
                      i.id === item.id &&
                      (i.kind === "news" || i.kind === "formation")
                        ? {
                            ...i,
                            likeCount: patch.likeCount ?? i.likeCount,
                            commentCount: patch.commentCount ?? i.commentCount,
                            shareCount: patch.shareCount ?? i.shareCount,
                            viewCount: patch.viewCount ?? i.viewCount,
                            likedByMe: patch.likedByMe ?? i.likedByMe,
                          }
                        : i,
                    ),
                  );
                }}
              />
            ) : (
              <CommunityUnifiedCard key={`${item.kind}-${item.id}`} item={item} fr={fr} />
            ),
          )}
        </div>
      ) : null}

      <div ref={sentinelRef} className="py-6 text-center text-xs text-[#a8a29e]">
        {loading ? "…" : done && items.length > 0 ? (fr ? "Fin" : "End") : ""}
      </div>

      {bpToast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#305f33] px-4 py-2 text-sm font-bold text-white shadow-lg">
          {bpToast}
        </div>
      ) : null}

      <CommunityHelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
