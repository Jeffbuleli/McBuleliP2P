"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityPostCard } from "@/components/community/community-post-card";
import { CommunityModuleHeader } from "@/components/community/community-module-header";
import {
  CommunityEmptyState,
  EmptyNewsIllustration,
} from "@/components/community/community-empty-illustrations";
import { CommunityFilterTabs } from "@/components/community/community-filter-tabs";
import { prepareCommunityImageFile } from "@/lib/community-image";
import type { FeedPostView } from "@/lib/community/feed-service";

type FeedSort = "recent" | "popular" | "following";

const FEED_TABS = [
  { id: "recent" as const, labelFr: "Récentes", labelEn: "Recent" },
  { id: "popular" as const, labelFr: "Populaires", labelEn: "Popular" },
  { id: "following" as const, labelFr: "Suivies", labelEn: "Following" },
];

export function CommunityFeedClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [sort, setSort] = useState<FeedSort>("recent");
  const [posts, setPosts] = useState<FeedPostView[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [body, setBody] = useState("");
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bpToast, setBpToast] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(
    async (reset = false) => {
      if (loading || (done && !reset)) return;
      setLoading(true);
      try {
        const q = new URLSearchParams({ limit: "15", sort });
        if (!reset && cursor) q.set("cursor", cursor);
        const res = await fetch(`/api/community/feed?${q}`);
        const j = await res.json();
        const batch = (j.posts ?? []) as FeedPostView[];
        setPosts((p) => (reset ? batch : [...p, ...batch]));
        setCursor(j.nextCursor ?? null);
        setDone(!j.nextCursor);
      } finally {
        setLoading(false);
      }
    },
    [cursor, done, loading, sort],
  );

  useEffect(() => {
    setCursor(null);
    setDone(false);
    void loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const onImagePick = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const prep = await prepareCommunityImageFile(file);
      const res = await fetch("/api/community/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prep),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "upload_failed");
      setMediaId(j.id);
    } catch {
      setError(fr ? "Image refusée" : "Image rejected");
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
      const res = await fetch("/api/community/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          postType: mediaId ? "image" : "text",
          mediaIds: mediaId ? [mediaId] : undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "failed");
        return;
      }
      setPosts((p) => [j.post as FeedPostView, ...p]);
      setBody("");
      setMediaId(null);
      setShowComposer(false);
      if (j.bpGranted?.granted) {
        setBpToast(`+${j.bpGranted.points} BP`);
        setTimeout(() => setBpToast(null), 2500);
      }
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
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-3">
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
              {mediaId ? (fr ? "Image OK" : "Image added") : fr ? "+ Image" : "+ Image"}
              <input
                type="file"
                accept="image/*"
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

      <div ref={sentinel} className="py-6 text-center text-xs text-[#a8a29e]">
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
