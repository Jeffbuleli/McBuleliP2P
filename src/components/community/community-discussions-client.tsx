"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityModuleHeader } from "@/components/community/community-module-header";
import { CommunityFilterTabs } from "@/components/community/community-filter-tabs";
import {
  CommunityEmptyState,
  EmptyDiscussionIllustration,
} from "@/components/community/community-empty-illustrations";
import type {
  DiscussionCategoryView,
  DiscussionListItem,
} from "@/lib/community/discussion-service";

type DiscSort = "recent" | "popular" | "following";

const SORT_TABS = [
  { id: "recent" as const, labelFr: "Récentes", labelEn: "Recent" },
  { id: "popular" as const, labelFr: "Populaires", labelEn: "Popular" },
  { id: "following" as const, labelFr: "Suivies", labelEn: "Following" },
];

export function CommunityDiscussionsClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [sort, setSort] = useState<DiscSort>("recent");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<DiscussionCategoryView[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(
    async (reset = false) => {
      if (loading || (done && !reset)) return;
      setLoading(true);
      try {
        const q = new URLSearchParams({ limit: "15", sort });
        if (!reset && cursor) q.set("cursor", cursor);
        if (category) q.set("category", category);
        const res = await fetch(`/api/community/discussions?${q}`);
        const j = await res.json();
        const batch = (j.discussions ?? []) as DiscussionListItem[];
        setDiscussions((d) => (reset ? batch : [...d, ...batch]));
        setCategories((j.categories ?? []) as DiscussionCategoryView[]);
        setCursor(j.nextCursor ?? null);
        setDone(!j.nextCursor);
      } finally {
        setLoading(false);
      }
    },
    [category, cursor, done, loading, sort],
  );

  useEffect(() => {
    setCursor(null);
    setDone(false);
    void loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, category]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (e) => {
        if (e[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const publish = async () => {
    setPublishing(true);
    try {
      const res = await fetch("/api/community/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          categoryId: categoryId || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) return;
      setDiscussions((d) => [j.discussion as DiscussionListItem, ...d]);
      setTitle("");
      setBody("");
      setShowComposer(false);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-3">
      <CommunityModuleHeader title={fr ? "Discussions" : "Discussions"} />

      <CommunityFilterTabs tabs={SORT_TABS} active={sort} onChange={setSort} fr={fr} />

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            !category ? "bg-[#305f33] text-white" : "bg-[#f5f5f4] text-[#57534e]"
          }`}
          onClick={() => setCategory("")}
        >
          {fr ? "Toutes" : "All"}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
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
        className="mb-3 mt-3 w-full rounded-xl border border-dashed border-[#305f33] py-2.5 text-sm font-bold text-[#305f33]"
        onClick={() => setShowComposer((v) => !v)}
      >
        {showComposer
          ? fr
            ? "Fermer"
            : "Close"
          : fr
            ? "+ Nouvelle discussion"
            : "+ New discussion"}
      </button>

      {showComposer ? (
        <div className="fd-card mb-4 space-y-2 px-4 py-3">
          <input
            className="w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={fr ? "Sujet (min. 8)" : "Topic (min. 8)"}
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
          <textarea
            className="w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-sm"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={fr ? "Votre message (min. 20)" : "Your message (min. 20)"}
          />
          <button
            type="button"
            disabled={publishing}
            className="w-full rounded-xl bg-[#305f33] py-2 text-sm font-bold text-white disabled:opacity-50"
            onClick={() => void publish()}
          >
            {publishing ? "…" : fr ? "Publier" : "Post"}
          </button>
        </div>
      ) : null}

      {!loading && discussions.length === 0 ? (
        <CommunityEmptyState
          illustration={<EmptyDiscussionIllustration />}
          title={fr ? "Aucune discussion" : "No discussions yet"}
          body={
            fr
              ? "Lancez un sujet et échangez avec la communauté."
              : "Start a topic and talk with the community."
          }
        />
      ) : (
        <ul className="space-y-2">
          {discussions.map((d) => (
            <li key={d.id}>
              <Link
                href={`/app/community/discussions/${d.id}`}
                className="fd-card block px-4 py-3"
              >
                <p className="text-sm font-bold text-[#0c0a09]">{d.title}</p>
                <p className="mt-1 text-xs text-[#78716c]">
                  @{d.author.handle}
                  {d.category
                    ? ` · ${fr ? d.category.labelFr : d.category.labelEn}`
                    : ""}
                  {" · "}
                  {d.replyCount} {fr ? "réponses" : "replies"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div ref={sentinel} className="h-6" />
      {loading ? <p className="py-4 text-center text-xs text-[#78716c]">…</p> : null}
    </div>
  );
}
