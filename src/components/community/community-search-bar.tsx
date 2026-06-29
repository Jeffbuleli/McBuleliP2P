"use client";

import Link from "next/link";
import { useState } from "react";
import { IconSearch, IconTrophy } from "@/components/community/community-icons";
import {
  COMMUNITY_SEARCH_GO_BTN,
  COMMUNITY_SEARCH_INPUT,
  COMMUNITY_SEARCH_TOP_BTN,
} from "@/lib/community/community-ui";

export function CommunitySearchBar({
  fr,
  onSearch,
  loading,
  embedded = false,
}: {
  fr: boolean;
  onSearch: (q: string) => void;
  loading?: boolean;
  embedded?: boolean;
}) {
  const [q, setQ] = useState("");

  const submit = () => {
    const trimmed = q.trim();
    if (trimmed.length >= 2) onSearch(trimmed);
  };

  return (
    <div className={`flex items-center gap-2 ${embedded ? "" : "mb-3"}`}>
      <Link
        href="/app/community/traders?tab=top_trader"
        className={COMMUNITY_SEARCH_TOP_BTN}
        aria-label={fr ? "Top Trader" : "Top Trader"}
      >
        <IconTrophy size={16} className="shrink-0" />
        <span className="hidden text-[11px] font-extrabold sm:inline">
          Top Trader
        </span>
      </Link>
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">
          <IconSearch size={16} />
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={
            fr
              ? "Rechercher @membre, #tag, symbole…"
              : "Search @member, #tag, symbol…"
          }
          className={COMMUNITY_SEARCH_INPUT}
        />
      </div>
      <button
        type="button"
        disabled={loading || q.trim().length < 2}
        onClick={submit}
        className={COMMUNITY_SEARCH_GO_BTN}
      >
        {loading ? "…" : fr ? "OK" : "Go"}
      </button>
    </div>
  );
}
