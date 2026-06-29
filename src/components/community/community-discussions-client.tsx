"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityModuleHeader } from "@/components/community/community-module-header";
import { CommunityFilterTabs } from "@/components/community/community-filter-tabs";
import {
  CommunityEmptyState,
  EmptyDiscussionIllustration,
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
  COMMUNITY_PUBLISH_BTN,
  COMMUNITY_TEXTAREA,
} from "@/lib/community/community-ui";
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

function mapDiscussionError(code: string | undefined, fr: boolean): string {
  if (code === "invalid_body" || code === "title_too_short") {
    return fr ? "Sujet : min. 8 caractères" : "Topic: min. 8 characters";
  }
  if (code === "body_too_short") {
    return fr ? "Message : min. 20 caractères" : "Message: min. 20 characters";
  }
  return code ?? (fr ? "Échec" : "Failed");
}

export function CommunityDiscussionsClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [sort, setSort] = useState<DiscSort>("recent");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<DiscussionCategoryView[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (cursor: string | null) => {
      const q = new URLSearchParams({ limit: "15", sort });
      if (cursor) q.set("cursor", cursor);
      if (category) q.set("category", category);
      const res = await fetch(`/api/community/discussions?${q}`);
      const j = await res.json();
      const cats = (j.categories ?? []) as DiscussionCategoryView[];
      if (cats.length) setCategories(cats);
      return {
        items: (j.discussions ?? []) as DiscussionListItem[],
        nextCursor: (j.nextCursor as string | null) ?? null,
      };
    },
    [category, sort],
  );

  const {
    items: discussions,
    setItems: setDiscussions,
    loading,
    sentinelRef,
  } = useCommunityPaginatedLoad({
    loadPage,
    resetKey: `${sort}:${category}`,
  });

  const publish = async () => {
    if (title.trim().length < 8) {
      setError(fr ? "Sujet : min. 8 caractères" : "Topic: min. 8 characters");
      return;
    }
    if (body.trim().length < 20) {
      setError(fr ? "Message : min. 20 caractères" : "Message: min. 20 characters");
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const { ok, data } = await fetchJson<{
        error?: string;
        discussion?: DiscussionListItem;
      }>("/api/community/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          categoryId: categoryId || undefined,
        }),
      });
      if (!ok) {
        setError(mapDiscussionError(data.error, fr));
        return;
      }
      setDiscussions((d) => [data.discussion as DiscussionListItem, ...d]);
      setTitle("");
      setBody("");
      setCategoryId("");
      setShowComposer(false);
    } catch {
      setError(fr ? "Erreur serveur - réessayez" : "Server error - try again");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-4 pt-3">
      <CommunityModuleHeader title={fr ? "Discussions" : "Discussions"} />

      <CommunityFilterTabs tabs={SORT_TABS} active={sort} onChange={setSort} fr={fr} />

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          className={!category ? COMMUNITY_CHIP_ACTIVE : COMMUNITY_CHIP}
          onClick={() => setCategory("")}
        >
          {fr ? "Toutes" : "All"}
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
        className={`${COMMUNITY_DASHED_BTN} mb-3 mt-3`}
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
        <div className={`${COMMUNITY_FORM_PANEL} mb-4`}>
          <input
            className={COMMUNITY_INPUT}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={fr ? "Sujet (min. 8)" : "Topic (min. 8)"}
          />
          <select
            className={COMMUNITY_INPUT}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">{fr ? "Catégorie (optionnel)" : "Category (optional)"}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {fr ? c.labelFr : c.labelEn}
              </option>
            ))}
          </select>
          <textarea
            className={COMMUNITY_TEXTAREA}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={fr ? "Votre message (min. 20)" : "Your message (min. 20)"}
          />
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <button
            type="button"
            disabled={publishing}
            className={COMMUNITY_PUBLISH_BTN}
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
                className={COMMUNITY_CARD_LINK}
              >
                <p className="text-sm font-bold text-stone-50">{d.title}</p>
                <p className="mt-1 text-xs text-stone-400">
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

      <div ref={sentinelRef} className="h-6" />
      {loading ? <p className="py-4 text-center text-xs text-stone-500">…</p> : null}
    </div>
  );
}
