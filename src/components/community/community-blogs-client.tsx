"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityRewardsCard } from "@/components/community/community-rewards-card";
import type {
  BlogCategoryView,
  BlogPostListItem,
} from "@/lib/community/blog-service";

export function CommunityBlogsClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [categories, setCategories] = useState<BlogCategoryView[]>([]);
  const [category, setCategory] = useState<string>("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bpToast, setBpToast] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(
    async (reset = false) => {
      if (loading || (done && !reset)) return;
      setLoading(true);
      try {
        const q = new URLSearchParams({ limit: "12" });
        if (!reset && cursor) q.set("cursor", cursor);
        if (category) q.set("category", category);
        const res = await fetch(`/api/community/blogs?${q}`);
        const j = await res.json();
        const batch = (j.posts ?? []) as BlogPostListItem[];
        setPosts((p) => (reset ? batch : [...p, ...batch]));
        setCategories((j.categories ?? []) as BlogCategoryView[]);
        setCursor(j.nextCursor ?? null);
        setDone(!j.nextCursor);
      } finally {
        setLoading(false);
      }
    },
    [category, cursor, done, loading],
  );

  useEffect(() => {
    void loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

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

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/community/blogs", {
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
      const j = await res.json();
      if (!res.ok) {
        setError(j.error ?? "failed");
        return;
      }
      setPosts((p) => [j.post as BlogPostListItem, ...p]);
      setTitle("");
      setBody("");
      setExcerpt("");
      setShowComposer(false);
      if (j.bpGranted?.granted) {
        setBpToast(`+${j.bpGranted.points} BP`);
        setTimeout(() => setBpToast(null), 3000);
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-4">
      <Link href="/app/community" className="text-sm font-semibold text-[#305f33]">
        ← {fr ? "Communauté" : "Community"}
      </Link>
      <h1 className="mt-3 text-xl font-bold text-[#0c0a09]">Blogs</h1>
      <p className="mb-4 text-sm text-[#57534e]">
        {fr ? "Articles crypto & finance" : "Crypto & finance articles"}
      </p>

      <CommunityRewardsCard />

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            !category ? "bg-[#305f33] text-white" : "bg-[#f5f5f4] text-[#57534e]"
          }`}
          onClick={() => setCategory("")}
        >
          {fr ? "Tous" : "All"}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              category === c.slug
                ? "bg-[#305f33] text-white"
                : "bg-[#f5f5f4] text-[#57534e]"
            }`}
            onClick={() => setCategory(c.slug)}
          >
            {fr ? c.labelFr : c.labelEn}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="mb-4 w-full rounded-xl border border-dashed border-[#305f33] py-2.5 text-sm font-bold text-[#305f33]"
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
        <div className="fd-card mb-4 space-y-3 px-4 py-4">
          <input
            className="w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={fr ? "Titre (min. 10)" : "Title (min. 10)"}
          />
          <select
            className="w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-sm"
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
            className="w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-sm"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder={fr ? "Résumé court" : "Short excerpt"}
          />
          <textarea
            className="w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-sm"
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={fr ? "Contenu markdown (min. 200 car.)" : "Markdown body (min. 200 chars)"}
          />
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <button
            type="button"
            disabled={publishing}
            className="w-full rounded-xl bg-[#305f33] py-2.5 text-sm font-bold text-white disabled:opacity-50"
            onClick={() => void publish()}
          >
            {publishing ? "…" : fr ? "Publier" : "Publish"}
          </button>
        </div>
      ) : null}

      <ul className="space-y-3">
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/app/community/blogs/${p.slug}`} className="fd-card block px-4 py-3">
              {p.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.coverUrl}
                  alt=""
                  className="mb-2 h-32 w-full rounded-xl object-cover"
                />
              ) : null}
              <p className="text-sm font-bold text-[#0c0a09]">{p.title}</p>
              <p className="mt-1 text-xs text-[#78716c]">
                <Link
                  href={`/app/community/u/${p.author.handle}`}
                  className="font-semibold text-[#305f33]"
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
                <p className="mt-2 line-clamp-2 text-sm text-[#57534e]">{p.excerpt}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>

      <div ref={sentinel} className="h-8" />
      {loading ? <p className="py-4 text-center text-xs text-[#78716c]">…</p> : null}

      {bpToast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#305f33] px-4 py-2 text-sm font-bold text-white shadow-lg">
          {bpToast}
        </div>
      ) : null}
    </div>
  );
}
