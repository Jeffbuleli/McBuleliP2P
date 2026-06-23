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
import { useCommunityPaginatedLoad } from "@/hooks/use-community-paginated-load";
import { fetchJson } from "@/lib/community/fetch-json";
import { uploadCommunityImage } from "@/lib/community-media-upload";
import type { FeedPostView } from "@/lib/community/feed-service";

type FeedSort = "recent" | "popular" | "trending" | "following";

const FEED_TABS = [
  { id: "recent" as const, labelFr: "Récentes", labelEn: "Recent" },
  { id: "trending" as const, labelFr: "Tendances", labelEn: "Trending" },
  { id: "popular" as const, labelFr: "Populaires", labelEn: "Popular" },
  { id: "following" as const, labelFr: "Suivies", labelEn: "Following" },
];

function mapFeedError(code: string | undefined, fr: boolean): string {
  if (code === "invalid_body" || code === "community_post_length") {
    return fr ? "Texte : min. 20 caractères" : "Text: min. 20 characters";
  }
  if (code === "community_post_cooldown") {
    return fr ? "Attendez 30 s entre deux publications" : "Wait 30s between posts";
  }
  if (code === "community_content_blocked") {
    return fr
      ? "Publication refusée — respectez la charte communauté."
      : "Post blocked — please follow community guidelines.";
  }
  if (code === "invalid_media") {
    return fr ? "Image invalide — réessayez" : "Invalid image — try again";
  }
  if (code === "community_image_too_large") {
    return fr ? "Image trop lourde" : "Image too large";
  }
  if (code === "community_image_invalid" || code === "community_image_invalid_mime") {
    return fr ? "Format image non supporté" : "Unsupported image format";
  }
  if (code === "r2_upload_failed" || code === "r2_object_missing") {
    return fr ? "Échec envoi image (R2)" : "Image upload failed (R2)";
  }
  if (code === "r2_not_configured" || code === "community_image_use_r2") {
    return fr
      ? "Stockage R2 non configuré sur le serveur"
      : "R2 storage not configured on server";
  }
  if (code === "timeout") {
    return fr ? "Délai dépassé — réessayez" : "Timed out — try again";
  }
  if (code === "network_error") {
    return fr ? "Connexion impossible — vérifiez le réseau" : "Network error — check connection";
  }
  if (code === "invalid_json" || code?.startsWith("http_")) {
    return fr ? "Erreur serveur — réessayez" : "Server error — try again";
  }
  return code ?? (fr ? "Échec" : "Failed");
}

export function CommunityFeedClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [sort, setSort] = useState<FeedSort>("recent");
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
      const res = await fetch(`/api/community/feed?${q}`);
      const j = await res.json();
      return {
        items: (j.posts ?? []) as FeedPostView[],
        nextCursor: (j.nextCursor as string | null) ?? null,
      };
    },
    [sort],
  );

  const { items: posts, setItems: setPosts, loading, done, sentinelRef } =
    useCommunityPaginatedLoad({
      loadPage,
      resetKey: sort,
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

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-4 pt-3">
      <CommunityModuleHeader title={fr ? "Actualités" : "News"} />

      <CommunityFilterTabs
        tabs={FEED_TABS}
        active={sort}
        onChange={setSort}
        fr={fr}
      />

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
            ? "+ Publier"
            : "+ Post"}
      </button>

      {showComposer ? (
        <section className="fd-card mb-4 p-4">
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
            <label className="cursor-pointer rounded-lg border border-[#e8f3ee] px-3 py-2 text-xs font-semibold text-[#305f33]">
              {uploading
                ? "…"
                : mediaId
                  ? fr
                    ? "Image OK"
                    : "Image added"
                  : fr
                    ? "+ Image"
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
              className="ml-auto min-h-[44px] rounded-xl bg-[#305f33] px-5 text-sm font-bold text-white disabled:opacity-50"
            >
              {publishing ? "…" : fr ? "Publier" : "Post"}
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        </section>
      ) : null}

      {!loading && posts.length === 0 ? (
        <CommunityEmptyState
          illustration={<EmptyNewsIllustration />}
          title={fr ? "Aucune publication" : "No posts yet"}
          body={
            fr
              ? "Soyez le premier à partager une actu crypto."
              : "Be the first to share crypto news."
          }
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
        {loading ? "…" : done && posts.length > 0 ? (fr ? "Fin" : "End") : ""}
      </div>

      {bpToast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#305f33] px-4 py-2 text-sm font-bold text-white shadow-lg">
          {bpToast}
        </div>
      ) : null}
    </div>
  );
}
