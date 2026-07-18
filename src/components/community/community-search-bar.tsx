"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CommunityAvatar } from "@/components/community/community-avatar";
import {
  IconHashtag,
  IconSearch,
  IconTrophy,
  IconUser,
} from "@/components/community/community-icons";
import type { SearchSuggestItem } from "@/lib/community/search-suggest-service";

const RECENT_KEY = "mb_community_search_recent";
const MAX_RECENT = 6;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter((s) => s.length >= 1)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function pushRecent(q: string) {
  if (typeof window === "undefined") return;
  const next = [q, ...readRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(
    0,
    MAX_RECENT,
  );
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function SuggestIcon({ item }: { item: SearchSuggestItem }) {
  if (item.kind === "person") {
    return (
      <CommunityAvatar
        label={item.label}
        avatarUrl={item.avatarUrl}
        sizeClass="h-8 w-8"
        textClass="text-[10px]"
      />
    );
  }
  if (item.kind === "tag") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eaf5ee] text-[#305f33]">
        <IconHashtag size={14} />
      </span>
    );
  }
  if (item.kind === "signal") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fef3c7] text-[#b45309] text-[10px] font-extrabold">
        $
      </span>
    );
  }
  if (item.kind === "media") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f4f2] text-[10px] font-bold text-[#57534e]">
        {item.mediaKind === "video" ? "VID" : "IMG"}
      </span>
    );
  }
  if (item.kind === "query") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ff] text-[#4338ca]">
        <IconSearch size={14} />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f4f2] text-[#57534e]">
      <IconUser size={14} />
    </span>
  );
}

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
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [items, setItems] = useState<SearchSuggestItem[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = q.trim();
    if (trimmed.length < 1) {
      abortRef.current?.abort();
      setItems([]);
      setSuggesting(false);
      setAiUsed(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setSuggesting(true);
      const params = new URLSearchParams({
        q: trimmed,
        limit: "12",
        locale: fr ? "fr" : "en",
      });
      fetch(`/api/community/search/suggest?${params}`, {
        cache: "no-store",
        signal: ac.signal,
      })
        .then((r) => r.json())
        .then((d: { items?: SearchSuggestItem[]; ai?: boolean }) => {
          setItems(d.items ?? []);
          setAiUsed(!!d.ai);
          setActive(0);
          setOpen(true);
        })
        .catch((e) => {
          if ((e as Error).name === "AbortError") return;
          setItems([]);
        })
        .finally(() => {
          if (!ac.signal.aborted) setSuggesting(false);
        });
    }, 160);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, fr]);

  const runSearch = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 1) return;
    pushRecent(trimmed);
    setRecent(readRecent());
    setOpen(false);
    onSearch(trimmed);
  };

  const applyItem = (item: SearchSuggestItem) => {
    if (item.href?.startsWith("/app/community/u/")) {
      pushRecent(item.query ?? item.label);
      setRecent(readRecent());
      setOpen(false);
      router.push(item.href);
      return;
    }
    if (item.href?.startsWith("/app/community/tag/") || item.href?.startsWith("/community/tag/")) {
      pushRecent(item.query ?? item.label);
      setRecent(readRecent());
      setOpen(false);
      router.push(item.href);
      return;
    }
    if (item.href?.startsWith("/app/community/post/")) {
      pushRecent(item.query ?? item.label);
      setRecent(readRecent());
      setOpen(false);
      router.push(item.href);
      return;
    }
    runSearch(item.query ?? item.label);
  };

  const showPanel = open && (items.length > 0 || recent.length > 0 || suggesting);

  return (
    <div
      ref={rootRef}
      className={`relative flex items-center gap-2 ${embedded ? "" : "mb-3"}`}
    >
      <Link
        href="/app/community/traders?tab=top_trader"
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[#dce8e0] bg-gradient-to-br from-[#eaf5ee] to-white px-2.5 text-[#305f33] shadow-sm ring-1 ring-[#305f33]/5 active:scale-[0.98] sm:px-3"
        aria-label={fr ? "Top Trader" : "Top Trader"}
      >
        <IconTrophy size={16} className="shrink-0" />
        <span className="hidden text-[11px] font-extrabold sm:inline">
          Top Trader
        </span>
      </Link>

      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[#a8a29e]">
          <IconSearch size={16} />
        </span>
        <input
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              const pick = items[active];
              if (open && pick) applyItem(pick);
              else runSearch(q);
            }
          }}
          placeholder={
            fr
              ? "Moteur : @user, #tag, texte, photo…"
              : "Engine: @user, #tag, text, photo…"
          }
          className={`h-11 w-full rounded-xl border bg-white pl-9 pr-10 text-sm text-[#292524] placeholder:text-[#a8a29e] ${
            embedded
              ? "border-[#dce8e0] shadow-inner ring-1 ring-[#305f33]/5"
              : "border-[#e8f3ee]"
          }`}
        />
        {(suggesting || loading) && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#a8a29e]">
            …
          </span>
        )}

        {showPanel ? (
          <div
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-[70vh] overflow-y-auto rounded-2xl border border-[#e8f3ee] bg-white py-2 shadow-xl"
          >
            {aiUsed ? (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#78716c]">
                {fr ? "Prédictions IA + données live" : "AI predictions + live data"}
              </p>
            ) : (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[#78716c]">
                {fr ? "Suggestions" : "Suggestions"}
              </p>
            )}

            {items.length === 0 && !suggesting && recent.length > 0 ? (
              <div className="px-2 pb-1">
                <p className="px-2 py-1 text-[10px] font-bold text-[#a8a29e]">
                  {fr ? "Récents" : "Recent"}
                </p>
                {recent.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="option"
                    onClick={() => {
                      setQ(r);
                      runSearch(r);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-[#f7fbf8]"
                  >
                    <IconSearch size={14} className="text-[#a8a29e]" />
                    <span className="truncate font-semibold text-[#0c0a09]">{r}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={idx === active}
                onMouseEnter={() => setActive(idx)}
                onClick={() => applyItem(item)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left ${
                  idx === active ? "bg-[#f0faf4]" : "hover:bg-[#f7fbf8]"
                }`}
              >
                <SuggestIcon item={item} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[#0c0a09]">
                    {item.label}
                  </span>
                  {item.subtitle ? (
                    <span className="block truncate text-[11px] text-[#78716c]">
                      {item.subtitle}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-[#a8a29e]">
                  {item.kind === "person"
                    ? fr
                      ? "Membre"
                      : "Member"
                    : item.kind === "tag"
                      ? "#"
                      : item.kind === "query"
                        ? "AI"
                        : item.kind === "signal"
                          ? "FX"
                          : item.kind === "media"
                            ? fr
                              ? "Média"
                              : "Media"
                            : fr
                              ? "Post"
                              : "Post"}
                </span>
              </button>
            ))}

            {q.trim().length >= 1 ? (
              <button
                type="button"
                onClick={() => runSearch(q)}
                className="mx-2 mt-1 flex w-[calc(100%-1rem)] items-center justify-center gap-2 rounded-xl bg-[#305f33] px-3 py-2.5 text-xs font-bold text-white"
              >
                <IconSearch size={14} />
                {fr ? `Chercher « ${q.trim()} »` : `Search “${q.trim()}”`}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        disabled={loading || q.trim().length < 1}
        onClick={() => runSearch(q)}
        className="h-11 shrink-0 rounded-xl bg-gradient-to-br from-[#305f33] to-[#3d8f5a] px-4 text-sm font-bold text-white shadow-md disabled:opacity-50 active:scale-[0.98]"
      >
        {loading ? "…" : fr ? "OK" : "Go"}
      </button>
    </div>
  );
}
