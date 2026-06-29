"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityModuleHeader } from "@/components/community/community-module-header";
import {
  CommunityEmptyState,
  EmptyBlogIllustration,
} from "@/components/community/community-empty-illustrations";
import { useCommunityPaginatedLoad } from "@/hooks/use-community-paginated-load";
import { fetchJson } from "@/lib/community/fetch-json";
import {
  COMMUNITY_CARD_LINK,
  COMMUNITY_CHIP,
  COMMUNITY_CHIP_ACTIVE,
  COMMUNITY_DASHED_BTN,
  COMMUNITY_FORM_PANEL,
  COMMUNITY_INPUT,
  COMMUNITY_MEDIA_FRAME,
  COMMUNITY_PUBLISH_BTN,
  COMMUNITY_TEXTAREA,
  COMMUNITY_TOAST,
} from "@/lib/community/community-ui";
import type {
  BlogCategoryView,
  BlogPostListItem,
} from "@/lib/community/blog-service";

export function CommunityBlogsClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [categories, setCategories] = useState<BlogCategoryView[]>([]);
  const [category, setCategory] = useState<string>("");
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bpToast, setBpToast] = useState<string | null>(null);

  const loadPage = useCallback(
    async (cursor: string | null) => {
      const q = new URLSearchParams({ limit: "12" });
      if (cursor) q.set("cursor", cursor);
      if (category) q.set("category", category);
      const res = await fetch(`/api/community/blogs?${q}`);
      const j = await res.json();
      const cats = (j.categories ?? []) as BlogCategoryView[];
      if (cats.length) setCategories(cats);
      return {
        items: (j.posts ?? []) as BlogPostListItem[],
        nextCursor: (j.nextCursor as string | null) ?? null,
      };
    },
    [category],
  );

  const { items: posts, setItems: setPosts, loading, sentinelRef } =
    useCommunityPaginatedLoad({
      loadPage,
      resetKey: category,
    });

  const publish = async () => {
    if (title.trim().length < 10) {
      setError(fr ? "Titre : min. 10 caractères" : "Title: min. 10 characters");
      return;
    }
    if (body.trim().length < 200) {
      setError(fr ? "Contenu : min. 200 caractères" : "Body: min. 200 characters");
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const { ok, data } = await fetchJson<{
        error?: string;
        post?: BlogPostListItem;
        bpGranted?: { granted?: boolean; points?: number };
      }>("/api/community/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          excerpt: excerpt.trim() || undefined,
          categoryId: categoryId || undefined,
          publish: true,
        }),
      });
      if (!ok) {
        setError(
          data.error === "invalid_body"
            ? fr
              ? "Vérifiez titre (10+) et contenu (200+)"
              : "Check title (10+) and body (200+)"
            : data.error === "timeout"
              ? fr
                ? "Délai dépassé - réessayez"
                : "Timed out - try again"
              : (data.error ?? "failed"),
        );
        return;
      }
      setPosts((p) => [data.post as BlogPostListItem, ...p]);
      setTitle("");
      setBody("");
      setExcerpt("");
      setShowComposer(false);
      if (data.bpGranted?.granted) {
        setBpToast(`+${data.bpGranted.points} BP`);
        setTimeout(() => setBpToast(null), 3000);
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message === "timeout"
          ? fr
            ? "Délai dépassé - réessayez"
            : "Timed out - try again"
          : fr
            ? "Erreur serveur - réessayez"
            : "Server error - try again",
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-4 pt-3">
      <CommunityModuleHeader title="Blogs" />

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={!category ? COMMUNITY_CHIP_ACTIVE : COMMUNITY_CHIP}
          onClick={() => setCategory("")}
        >
          {fr ? "Tous" : "All"}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={category === c.slug ? COMMUNITY_CHIP_ACTIVE : COMMUNITY_CHIP}
            onClick={() => setCategory(c.slug)}
          >
            {fr ? c.labelFr : c.labelEn}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={`${COMMUNITY_DASHED_BTN} mb-4`}
        onClick={() => setShowComposer((v) => !v)}
      >
        {showComposer
          ? fr
            ? "Fermer l'éditeur"
            : "Close editor"
          : fr
            ? "Écrire un article (+100 BP)"
            : "Write an article (+100 BP)"}
      </button>

      {showComposer ? (
        <div className={`${COMMUNITY_FORM_PANEL} mb-4 space-y-3`}>
          <input
            className={COMMUNITY_INPUT}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={fr ? "Titre (min. 10)" : "Title (min. 10)"}
          />
          <select
            className={COMMUNITY_INPUT}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">{fr ? "Catégorie" : "Category"}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {fr ? c.labelFr : c.labelEn}
              </option>
            ))}
          </select>
          <input
            className={COMMUNITY_INPUT}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder={fr ? "Résumé court" : "Short excerpt"}
          />
          <textarea
            className={COMMUNITY_TEXTAREA}
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={fr ? "Contenu markdown (min. 200 car.)" : "Markdown body (min. 200 chars)"}
          />
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <button
            type="button"
            disabled={publishing}
            className={COMMUNITY_PUBLISH_BTN}
            onClick={() => void publish()}
          >
            {publishing ? "…" : fr ? "Publier" : "Publish"}
          </button>
        </div>
      ) : null}

      {!loading && posts.length === 0 ? (
        <CommunityEmptyState
          illustration={<EmptyBlogIllustration />}
          title={fr ? "Aucun article" : "No articles yet"}
          body={
            fr
              ? "Publiez votre premier article crypto."
              : "Publish your first crypto article."
          }
        />
      ) : (
      <ul className="space-y-3">
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/app/community/blogs/${p.slug}`} className={COMMUNITY_CARD_LINK}>
              {p.coverUrl ? (
                <div className={`${COMMUNITY_MEDIA_FRAME} mb-2`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.coverUrl}
                    alt=""
                    className="h-32 w-full object-cover"
                  />
                </div>
              ) : null}
              <p className="text-sm font-bold text-stone-50">{p.title}</p>
              <p className="mt-1 text-xs text-stone-400">
                <Link
                  href={`/app/community/u/${p.author.handle}`}
                  className="font-semibold text-emerald-400"
                  onClick={(e) => e.stopPropagation()}
                >
                  @{p.author.handle}
                </Link>
                {" · "}
                {new Date(p.publishedAt).toLocaleDateString(fr ? "fr-FR" : "en-US")}
                {p.category
                  ? ` · ${fr ? p.category.labelFr : p.category.labelEn}`
                  : ""}
              </p>
              {p.excerpt ? (
                <p className="mt-2 line-clamp-2 text-sm text-stone-300">{p.excerpt}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      )}

      <div ref={sentinelRef} className="h-8" />
      {loading ? <p className="py-4 text-center text-xs text-stone-500">…</p> : null}

      {bpToast ? (
        <div className={`${COMMUNITY_TOAST} bottom-24`}>{bpToast}</div>
      ) : null}
    </div>
  );
}
