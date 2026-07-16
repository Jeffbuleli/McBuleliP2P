"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { CommunityAvatar } from "@/components/community/community-avatar";
import { CommunityCategoryNav } from "@/components/community/community-category-nav";
import { CommunityHomeHeader } from "@/components/community/community-home-header";
import {
  CommunityHelpSheet,
} from "@/components/community/community-help-sheet";
import { CommunityPostCard } from "@/components/community/community-post-card";
import { CommunityPostComposer } from "@/components/community/community-post-composer";
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
import type { CommunitySearchHit, CommunityProfileSearchHit } from "@/lib/community/search-service";
import type { TradingSignalView } from "@/lib/community/signals-service";
import { CommunitySignalCard } from "@/components/community/community-signal-card";
import { IconChart, IconHashtag, IconUser } from "@/components/community/community-icons";
import { CommunityLiveBanner } from "@/components/community/community-live-banner";
import { communityPostAppPath } from "@/lib/community/share-url";

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
    contentKind: item.meta?.contentKind ?? (item.kind === "formation" ? "formation" : "news"),
    formationMeta: item.formationMeta ?? null,
    botTemplateMeta: item.botTemplateMeta ?? null,
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
  const [searchProfiles, setSearchProfiles] = useState<CommunityProfileSearchHit[]>([]);
  const [searchSignals, setSearchSignals] = useState<TradingSignalView[]>([]);
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
    category === "for_you"
      ? "for_you"
      : category === "following"
        ? "following"
        : category === "all" || category === "news" || category === "trending"
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

  const clearSearch = () => {
    setSearchQ(null);
    setSearchHits([]);
    setSearchProfiles([]);
    setSearchSignals([]);
  };

  const showNewsComposer =
    category === "all" ||
    category === "for_you" ||
    category === "news" ||
    category === "trending";

  const runSearch = async (q: string) => {
    setSearchLoading(true);
    setSearchQ(q);
    try {
      const res = await fetch(
        `/api/community/search?q=${encodeURIComponent(q)}&unified=1&limit=12`,
      );
      const j = await res.json();
      setSearchHits((j.posts ?? j.hits ?? []) as CommunitySearchHit[]);
      setSearchProfiles((j.profiles ?? []) as CommunityProfileSearchHit[]);
      setSearchSignals((j.signals ?? []) as TradingSignalView[]);
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
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-4 pt-3">
      <CommunityHomeHeader
        fr={fr}
        bp={bp}
        searchLoading={searchLoading}
        onSearch={(q) => void runSearch(q)}
        onHelpOpen={() => setHelpOpen(true)}
      />

      {!searchQ ? <CommunityLiveBanner fr={fr} /> : null}

      <CommunityCategoryNav
        active={category}
        onChange={(c) => {
          setCategory(c);
          setSearchQ(null);
          setSearchHits([]);
          setSearchProfiles([]);
          setSearchSignals([]);
        }}
        fr={fr}
      />

      {searchQ ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#44403c]">
            {searchLoading
              ? fr
                ? "Recherche…"
                : "Searching…"
              : fr
                ? `${searchHits.length + searchProfiles.length + searchSignals.length} résultat${searchHits.length + searchProfiles.length + searchSignals.length !== 1 ? "s" : ""} pour « ${searchQ} »`
                : `${searchHits.length + searchProfiles.length + searchSignals.length} result${searchHits.length + searchProfiles.length + searchSignals.length !== 1 ? "s" : ""} for “${searchQ}”`}
          </p>
          <button
            type="button"
            onClick={clearSearch}
            className="shrink-0 text-xs font-bold text-[#305f33]"
          >
            {fr ? "Effacer" : "Clear"}
          </button>
        </div>
      ) : null}

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

      {searchQ ? (
        searchLoading &&
        searchHits.length === 0 &&
        searchProfiles.length === 0 &&
        searchSignals.length === 0 ? (
          <CommunityFeedSkeleton rows={3} />
        ) : searchHits.length === 0 &&
          searchProfiles.length === 0 &&
          searchSignals.length === 0 ? (
          <CommunityEmptyState
            illustration={<EmptyNewsIllustration />}
            title={fr ? "Aucun résultat" : "No results"}
            body={
              fr
                ? "Essayez d'autres mots-clés, un @pseudo ou un #hashtag."
                : "Try different keywords, an @handle or a #hashtag."
            }
          />
        ) : (
          <div className="space-y-5">
            {searchProfiles.length > 0 ? (
              <section>
                <h2 className="mb-2 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-[#78716c]">
                  <IconUser size={14} />
                  {fr ? "Membres" : "Members"}
                </h2>
                <div className="space-y-2">
                  {searchProfiles.map((p) => (
                    <Link
                      key={p.handle}
                      href={`/app/community/u/${p.handle}`}
                      className="flex items-center gap-3 rounded-2xl border border-[#dce8e0] bg-white px-4 py-3 shadow-sm transition active:scale-[0.99]"
                    >
                      <CommunityAvatar
                        label={p.displayName}
                        avatarUrl={p.avatarUrl}
                        sizeClass="h-11 w-11"
                        className="ring-2 ring-white"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#0c0a09]">{p.displayName}</p>
                        <p className="text-xs text-[#78716c]">@{p.handle} · {p.reputationScore} BP</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
            {searchSignals.length > 0 ? (
              <section>
                <h2 className="mb-2 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-[#78716c]">
                  <IconChart size={14} />
                  {fr ? "Signaux" : "Signals"}
                </h2>
                <div className="space-y-3">
                  {searchSignals.map((s) => (
                    <CommunitySignalCard key={s.id} signal={s} />
                  ))}
                </div>
              </section>
            ) : null}
            {searchHits.length > 0 ? (
              <section>
                <h2 className="mb-2 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-[#78716c]">
                  <IconHashtag size={14} />
                  {fr ? "Publications" : "Posts"}
                </h2>
                <div className="space-y-4">
                  {searchHits.map((hit) => (
                    <CommunityPostCard
                      key={`search-${hit.id}`}
                      post={searchToPost(hit)}
                      linkToDetail={false}
                      onUpdate={() => {}}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )
      ) : loading && items.length === 0 ? (
        <CommunityFeedSkeleton rows={4} />
      ) : !loading && items.length === 0 ? (
        <CommunityEmptyState
          illustration={<EmptyNewsIllustration />}
          title={
            category === "following"
              ? fr
                ? "Aucun contenu suivi"
                : "Nothing from people you follow"
              : category === "for_you"
                ? fr
                  ? "Rien à vous proposer pour l'instant"
                  : "Nothing to recommend yet"
                : fr
                  ? "Aucune publication"
                  : "No posts yet"
          }
          body={
            category === "following"
              ? fr
                ? "Suivez des traders depuis leur profil ou le classement pour voir leurs publications ici."
                : "Follow traders from their profile or the leaderboard to see their posts here."
              : category === "for_you"
                ? fr
                  ? "Suivez des membres, likez et commentez - votre fil Pour vous s'adapte à vos intérêts."
                  : "Follow members, like and comment - your For you feed adapts to your interests."
                : fr
                  ? "Soyez le premier à partager avec la communauté."
                  : "Be the first to share with the community."
          }
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) =>
            item.kind === "news" || item.kind === "formation" ? (
              <CommunityPostCard
                key={`post-${item.id}`}
                post={toFeedPost(item)}
                linkToDetail={false}
                trackImpression
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
      )}

      {!searchQ ? (
        <div ref={sentinelRef} className="py-6 text-center text-xs text-[#a8a29e]">
          {loading ? "…" : done && items.length > 0 ? (fr ? "Fin" : "End") : ""}
        </div>
      ) : null}

      {bpToast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#305f33] px-4 py-2 text-sm font-bold text-white shadow-lg">
          {bpToast}
        </div>
      ) : null}

      <CommunityHelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
