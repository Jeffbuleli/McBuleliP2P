"use client";

import { useState } from "react";
import { IconSearch } from "@/components/community/community-icons";

export function CommunitySearchBar({
  fr,
  onSearch,
  loading,
}: {
  fr: boolean;
  onSearch: (q: string) => void;
  loading?: boolean;
}) {
  const [q, setQ] = useState("");

  const submit = () => {
    const trimmed = q.trim();
    if (trimmed.length >= 2) onSearch(trimmed);
  };

  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e]">
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
            fr ? "Rechercher mots-clés ou #hashtag…" : "Search keywords or #hashtag…"
          }
          className="h-11 w-full rounded-xl border border-[#e8f3ee] bg-white pl-9 pr-3 text-sm text-[#292524] placeholder:text-[#a8a29e]"
        />
      </div>
      <button
        type="button"
        disabled={loading || q.trim().length < 2}
        onClick={submit}
        className="h-11 shrink-0 rounded-xl bg-[#305f33] px-4 text-sm font-bold text-white disabled:opacity-50"
      >
        {loading ? "…" : fr ? "OK" : "Go"}
      </button>
    </div>
  );
}
