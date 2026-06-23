"use client";

import { useState } from "react";
import { IconSearch } from "@/components/community/community-icons";

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
            fr
              ? "Rechercher @membre, #tag, symbole…"
              : "Search @member, #tag, symbol…"
          }
          className={`h-11 w-full rounded-xl border bg-white pl-9 pr-3 text-sm text-[#292524] placeholder:text-[#a8a29e] ${
            embedded
              ? "border-[#dce8e0] shadow-inner ring-1 ring-[#305f33]/5"
              : "border-[#e8f3ee]"
          }`}
        />
      </div>
      <button
        type="button"
        disabled={loading || q.trim().length < 2}
        onClick={submit}
        className="h-11 shrink-0 rounded-xl bg-gradient-to-br from-[#305f33] to-[#3d8f5a] px-4 text-sm font-bold text-white shadow-md disabled:opacity-50 active:scale-[0.98]"
      >
        {loading ? "…" : fr ? "OK" : "Go"}
      </button>
    </div>
  );
}
