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
import { CommunityUnifiedCard } from "@/components/community/community-unified-card";
import {
  CommunityEmptyState,
  EmptyNewsIllustration,
} from "@/components/community/community-empty-illustrations";
import { CommunityFeedSkeleton } from "@/components/community/community-skeleton";
import { useCommunityPaginatedLoad } from "@/hooks/use-community-paginated-load";
import { fetchJson } from "@/lib/community/fetch-json";
import { uploadCommunityImage } from "@/lib/community-media-upload";
import type { FeedPostView } from "@/lib/community/feed-service";
import type { CommunityCategoryId } from "@/lib/community/nav-config";
import type { UnifiedFeedItem } from "@/lib/community/unified-feed-service";
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
    likeCount: item.likeCount,
    commentCount: item.commentCount,
    shareCount: item.shareCount,
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
  const [body, setBody] = useState("");
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bpToast, setBpToast] = useState<string | null>(null);

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
    category === "all" || category === "news"
      ? category
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
    category === "all" || category === "news";

  const onImagePick = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded = await uploadCommunityImage(file, "posts");
      setMediaId(uploaded.id);
    } catch (e) {
      const code = e instanceof Error ? e.message : "upload_failed";
      setError(
        code === "timeout"
          ? fr
            ? "Délai dépassé — réessayez"
            : "Timed out — try again"
          : code === "network_error"
            ? fr
              ? "Connexion impossible — vérifiez le réseau"
              : "Network error — check connection"
            : fr
              ? "Échec upload image"
              : "Image upload failed",
      );
    } finally {
      setUploading(false);
    }
  };

  const publish = async () => {
    if (body.trim().length < 20) {
      setError(fr ? "Min. 20 caractères" : "Min. 20 characters");
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const { ok, data } = await fetchJson<{
        error?: string;
        post?: FeedPostView;
        bpGranted?: { granted?: boolean; points?: number };
      }>("/api/community/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          postType: mediaId ? "image" : "text",
          mediaIds: mediaId ? [mediaId] : undefined,
        }),
      });
      if (!ok) {
        setError(data.error ?? "failed");
        return;
      }
      const post = data.post as FeedPostView;
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
        likedByMe: post.likedByMe,
        media: post.media,
      };
      setItems((list) => [unified, ...list]);
      setBody("");
      setMediaId(null);
      setShowComposer(false);
      if (data.bpGranted?.granted) {
        setBpToast(`+${data.bpGranted.points} BP`);
        setTimeout(() => setBpToast(null), 2500);
      }
    } finally {
      setPublishing(false);
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

      <CommunityCategoryNav active={category} onChange={setCategory} fr={fr} />

      {showNewsComposer ? (
        <>
          <button
            type="button"
            className="mb-3 mt-3 w-full rounded-xl bg-[#305f33] py-2.5 text-sm font-bold text-white active:scale-[0.99]"
            onClick={() => setShowComposer((v) => !v)}
          >
            {showComposer
              ? fr
                ? "Fermer"
                : "Close"
              : fr
                ? "+ Publier une actualité"
                : "+ Post news"}
          </button>

          {showComposer ? (
            <section className="mb-4 rounded-2xl border border-[#f0f4f2] bg-white p-4 shadow-sm">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder={
                  fr
                    ? "Partagez une actu crypto… (min. 20 car.)"
                    : "Share crypto news… (min. 20 chars)"
                }
                className="w-full resize-none rounded-xl border border-[#e8f3ee] bg-white px-3 py-2 text-sm"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="cursor-pointer rounded-lg border border-[#e8f3ee] px-3 py-2 text-xs font-semibold text-[#305f33] active:scale-95">
                  {uploading
                    ? "…"
                    : mediaId
                      ? fr
                        ? "Image OK"
                        : "Image added"
                      : "+ Image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    className="hidden"
                    onChange={(e) => onImagePick(e.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  type="button"
                  disabled={publishing}
                  onClick={() => void publish()}
                  className="ml-auto min-h-[44px] rounded-xl bg-[#305f33] px-5 text-sm font-bold text-white disabled:opacity-50 active:scale-95"
                >
                  {publishing ? "…" : fr ? "Publier" : "Post"}
                </button>
              </div>
              {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
            </section>
          ) : null}
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
      ) : (
        <div className="space-y-4">
          {items.map((item) =>
            item.kind === "news" ? (
              <CommunityPostCard
                key={`news-${item.id}`}
                post={toFeedPost(item)}
                onUpdate={(patch) => {
                  setItems((list) =>
                    list.map((i) =>
                      i.id === item.id && i.kind === "news"
                        ? {
                            ...i,
                            likeCount: patch.likeCount ?? i.likeCount,
                            commentCount: patch.commentCount ?? i.commentCount,
                            shareCount: patch.shareCount ?? i.shareCount,
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
