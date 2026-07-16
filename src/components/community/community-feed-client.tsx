"use client";

import { useCallback, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityPostCard } from "@/components/community/community-post-card";
import { CommunityModuleHeader } from "@/components/community/community-module-header";
import {
  CommunityEmptyState,
  EmptyNewsIllustration,
} from "@/components/community/community-empty-illustrations";
import { CommunityFilterTabs } from "@/components/community/community-filter-tabs";
import { UtilityTagIcon } from "@/components/community/utility-tag-icons";
import { useCommunityPaginatedLoad } from "@/hooks/use-community-paginated-load";
import { fetchJson } from "@/lib/community/fetch-json";
import { uploadCommunityImage } from "@/lib/community-media-upload";
import type { FeedPostView } from "@/lib/community/feed-service";
import {
  UTILITY_TAGS,
  utilityTagLabel,
  type UtilityTag,
} from "@/lib/community/utility-tags";

type FeedSort = "recent" | "popular" | "trending" | "following";
type TagFilter = UtilityTag | "all";

const FEED_TABS = [
  { id: "recent" as const, labelFr: "Récent", labelEn: "New" },
  { id: "trending" as const, labelFr: "Hot", labelEn: "Hot" },
  { id: "popular" as const, labelFr: "Top", labelEn: "Top" },
  { id: "following" as const, labelFr: "Suivi", labelEn: "Follow" },
];

function mapFeedError(code: string | undefined, fr: boolean): string {
  if (code === "invalid_body" || code === "community_post_length") {
    return fr ? "Min. 20 car." : "Min. 20 chars";
  }
  if (code === "community_post_cooldown") {
    return fr ? "Attendez 30 s" : "Wait 30s";
  }
  if (code === "community_content_blocked") {
    return fr ? "Refusé (charte)" : "Blocked";
  }
  if (code === "invalid_media") {
    return fr ? "Image invalide" : "Invalid image";
  }
  if (code === "community_image_too_large") {
    return fr ? "Image trop lourde" : "Image too large";
  }
  if (code === "community_image_invalid" || code === "community_image_invalid_mime") {
    return fr ? "Format non supporté" : "Unsupported format";
  }
  if (code === "r2_upload_failed" || code === "r2_object_missing") {
    return fr ? "Échec envoi" : "Upload failed";
  }
  if (code === "r2_not_configured" || code === "community_image_use_r2") {
    return fr ? "R2 non configuré" : "R2 not configured";
  }
  if (code === "timeout") {
    return fr ? "Délai dépassé" : "Timed out";
  }
  if (code === "network_error") {
    return fr ? "Hors ligne" : "Offline";
  }
  if (code === "invalid_json" || code?.startsWith("http_")) {
    return fr ? "Erreur serveur" : "Server error";
  }
  return code ?? (fr ? "Échec" : "Failed");
}

export function CommunityFeedClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [sort, setSort] = useState<FeedSort>("recent");
  const [tagFilter, setTagFilter] = useState<TagFilter>("all");
  const [body, setBody] = useState("");
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bpToast, setBpToast] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);

  const loadPage = useCallback(
    async (cursor: string | null) => {
      const q = new URLSearchParams({ limit: "15", sort });
      if (cursor) q.set("cursor", cursor);
      if (tagFilter !== "all") q.set("utilityTag", tagFilter);
      const res = await fetch(`/api/community/feed?${q}`);
      const j = await res.json();
      return {
        items: (j.posts ?? []) as FeedPostView[],
        nextCursor: (j.nextCursor as string | null) ?? null,
      };
    },
    [sort, tagFilter],
  );

  const { items: posts, setItems: setPosts, loading, done, sentinelRef } =
    useCommunityPaginatedLoad({
      loadPage,
      resetKey: `${sort}:${tagFilter}`,
    });

  const onImagePick = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const uploaded = await uploadCommunityImage(file, "posts");
      setMediaId(uploaded.id);
    } catch (e) {
      const code = e instanceof Error ? e.message : "upload_failed";
      setError(mapFeedError(code, fr));
    } finally {
      setUploading(false);
    }
  };

  const publish = async () => {
    if (body.trim().length < 20) {
      setError(fr ? "Min. 20 car." : "Min. 20 chars");
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
        setError(mapFeedError(data.error, fr));
        return;
      }
      setPosts((p) => [data.post as FeedPostView, ...p]);
      setBody("");
      setMediaId(null);
      setShowComposer(false);
      if (data.bpGranted?.granted) {
        setBpToast(`+${data.bpGranted.points} BP`);
        setTimeout(() => setBpToast(null), 2500);
      }
    } catch (e) {
      const code = e instanceof Error ? e.message : "failed";
      setError(mapFeedError(code, fr));
    } finally {
      setPublishing(false);
    }
  };

  const patchPost = (id: string, patch: Partial<FeedPostView>) => {
    setPosts((list) =>
      list.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  };

  const tagOptions: TagFilter[] = ["all", ...UTILITY_TAGS];

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-4 pt-3">
      <CommunityModuleHeader title={fr ? "Feed" : "Feed"} />

      <CommunityFilterTabs
        tabs={FEED_TABS}
        active={sort}
        onChange={setSort}
        fr={fr}
      />

      <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none">
        {tagOptions.map((tag) => {
          const active = tagFilter === tag;
          const label =
            tag === "all"
              ? fr
                ? "Tous"
                : "All"
              : utilityTagLabel(tag, fr);
          return (
            <button
              key={tag}
              type="button"
              title={label}
              aria-label={label}
              onClick={() => setTagFilter(tag)}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                active
                  ? "bg-[#305f33] text-white"
                  : "bg-[#f5f5f4] text-[#57534e]"
              }`}
            >
              <UtilityTagIcon tag={tag} />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="mb-3 mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#305f33] py-2.5 text-sm font-bold text-white active:scale-[0.99]"
        onClick={() => setShowComposer((v) => !v)}
      >
        <UtilityTagIcon tag="create" className="h-4 w-4" />
        {showComposer ? (fr ? "Fermer" : "Close") : (fr ? "Publier" : "Post")}
      </button>

      {showComposer ? (
        <section className="fd-card mb-4 p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={fr ? "Votre message…" : "Your message…"}
            className="w-full resize-none rounded-xl border border-[#e8f3ee] bg-white px-3 py-2 text-sm"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-lg border border-[#e8f3ee] px-3 py-2 text-xs font-semibold text-[#305f33]">
              {uploading ? "…" : mediaId ? "OK" : "+"}
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
              className="ml-auto min-h-[44px] rounded-xl bg-[#305f33] px-5 text-sm font-bold text-white disabled:opacity-50"
            >
              {publishing ? "…" : fr ? "OK" : "OK"}
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        </section>
      ) : null}

      {!loading && posts.length === 0 ? (
        <CommunityEmptyState
          illustration={<EmptyNewsIllustration />}
          title={fr ? "Vide" : "Empty"}
          body={fr ? "Publiez le premier post." : "Be the first to post."}
          action={
            <button
              type="button"
              className="rounded-xl bg-[#305f33] px-4 py-2 text-xs font-bold text-white"
              onClick={() => setShowComposer(true)}
            >
              {fr ? "Publier" : "Post"}
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              onUpdate={(patch) => patchPost(post.id, patch)}
            />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="py-6 text-center text-xs text-[#a8a29e]">
        {loading ? "…" : done && posts.length > 0 ? "·" : ""}
      </div>

      {bpToast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#305f33] px-4 py-2 text-sm font-bold text-white shadow-lg">
          {bpToast}
        </div>
      ) : null}
    </div>
  );
}
