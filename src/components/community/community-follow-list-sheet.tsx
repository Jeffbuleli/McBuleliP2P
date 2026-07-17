"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CommunityFollowUserRow } from "@/components/community/community-follow-user-row";
import type { FollowGraphPerson } from "@/lib/community/follows-service";

type Mode = "followers" | "following";

function SkeletonRows({ n = 6 }: { n?: number }) {
  return (
    <ul className="space-y-1 px-1 py-2">
      {Array.from({ length: n }).map((_, i) => (
        <li
          key={i}
          className="flex animate-pulse items-center gap-3 px-1 py-2.5"
        >
          <span className="h-11 w-11 shrink-0 rounded-full bg-[#e8f3ee]" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3.5 w-28 rounded bg-[#e8f3ee]" />
            <span className="block h-2.5 w-20 rounded bg-[#f0f4f2]" />
          </span>
          <span className="h-8 w-16 shrink-0 rounded-xl bg-[#f0f4f2]" />
        </li>
      ))}
    </ul>
  );
}

export function CommunityFollowListSheet({
  open,
  onClose,
  fr,
  handle,
  mode,
  onModeChange,
  followerCount,
  followingCount,
  onCountsChange,
}: {
  open: boolean;
  onClose: () => void;
  fr: boolean;
  handle: string;
  mode: Mode;
  onModeChange?: (mode: Mode) => void;
  followerCount?: number;
  followingCount?: number;
  onCountsChange?: (delta: { followers?: number; following?: number }) => void;
}) {
  const [people, setPeople] = useState<FollowGraphPerson[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyHandle, setBusyHandle] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const load = useCallback(
    async (cursor?: string | null, append = false) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const reqId = ++reqIdRef.current;

      setLoading(true);
      setError(null);
      try {
        const q = new URLSearchParams({ limit: "30" });
        if (cursor) q.set("cursor", cursor);
        const res = await fetch(
          `/api/community/profiles/${encodeURIComponent(handle)}/${mode}?${q}`,
          { cache: "no-store", signal: ac.signal },
        );
        if (!res.ok) {
          throw new Error(`http_${res.status}`);
        }
        const data = (await res.json()) as {
          people?: FollowGraphPerson[];
          nextCursor?: string | null;
          error?: string;
        };
        if (reqId !== reqIdRef.current) return;
        const batch = data.people ?? [];
        setPeople((prev) => (append ? [...prev, ...batch] : batch));
        setNextCursor(data.nextCursor ?? null);
      } catch (e) {
        if (ac.signal.aborted) return;
        if (reqId !== reqIdRef.current) return;
        if (!append) setPeople([]);
        setError(
          fr
            ? "Impossible de charger la liste. Réessaie."
            : "Could not load the list. Try again.",
        );
      } finally {
        if (reqId === reqIdRef.current) setLoading(false);
      }
    },
    [handle, mode, fr],
  );

  useEffect(() => {
    if (!open) return;
    setPeople([]);
    setNextCursor(null);
    setError(null);
    void load(null, false);
    return () => {
      abortRef.current?.abort();
    };
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const toggleFollow = async (person: FollowGraphPerson) => {
    if (person.isSelf) return;
    setBusyHandle(person.handle);
    try {
      const method = person.isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/community/traders/${person.handle}/follow`, {
        method,
      });
      if (!res.ok) return;
      const nextFollowing = !person.isFollowing;
      setPeople((list) =>
        list.map((p) =>
          p.handle === person.handle
            ? {
                ...p,
                isFollowing: nextFollowing,
                reason:
                  nextFollowing && p.followsYou
                    ? "mutual"
                    : p.reason === "mutual" && !nextFollowing
                      ? null
                      : p.reason,
              }
            : p,
        ),
      );
      onCountsChange?.(
        mode === "following"
          ? { following: nextFollowing ? 1 : -1 }
          : {},
      );
    } finally {
      setBusyHandle(null);
    }
  };

  if (!open) return null;

  const tabs: { id: Mode; label: string; count?: number }[] = [
    {
      id: "followers",
      label: fr ? "Abonnés" : "Followers",
      count: followerCount,
    },
    {
      id: "following",
      label: fr ? "Abonnements" : "Following",
      count: followingCount,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="follow-list-title"
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] border border-[#e8f3ee] bg-white shadow-2xl sm:rounded-[1.75rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-[#e8f3ee] bg-gradient-to-b from-[#f7fbf8] to-white px-4 pb-2 pt-3">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#d6d3d1] sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="follow-list-title"
                className="text-base font-extrabold text-[#0c0a09]"
              >
                @{handle}
              </h2>
              <p className="text-[11px] text-[#78716c]">
                {fr
                  ? "Découvre les liens entre membres"
                  : "Explore connections between members"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e8f3ee] bg-white text-lg leading-none text-[#78716c] active:scale-95"
              aria-label={fr ? "Fermer" : "Close"}
            >
              ×
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-[#eef6f1] p-1">
            {tabs.map((tab) => {
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onModeChange?.(tab.id)}
                  className={`rounded-lg px-2 py-2 text-center text-[12px] font-bold transition active:scale-[0.98] ${
                    active
                      ? "bg-white text-[#305f33] shadow-sm"
                      : "text-[#78716c]"
                  }`}
                >
                  {tab.label}
                  {typeof tab.count === "number" ? (
                    <span
                      className={`ml-1 tabular-nums ${
                        active ? "text-[#305f33]" : "text-[#a8a29e]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-[40vh] flex-1 overflow-y-auto px-3 py-1">
          {loading && people.length === 0 ? (
            <SkeletonRows />
          ) : error ? (
            <div className="px-3 py-10 text-center">
              <p className="text-sm text-[#78716c]">{error}</p>
              <button
                type="button"
                onClick={() => void load(null, false)}
                className="mt-3 rounded-xl bg-[#305f33] px-4 py-2 text-xs font-bold text-white"
              >
                {fr ? "Réessayer" : "Retry"}
              </button>
            </div>
          ) : people.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-sm font-semibold text-[#44403c]">
                {mode === "followers"
                  ? fr
                    ? "Pas encore d'abonnés"
                    : "No followers yet"
                  : fr
                    ? "Aucun abonnement"
                    : "Not following anyone"}
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#78716c]">
                {mode === "followers"
                  ? fr
                    ? "Partage ton profil ou publie pour attirer la communauté."
                    : "Share your profile or post to grow your community."
                  : fr
                    ? "Suis des membres actifs pour enrichir ton fil Suivis."
                    : "Follow active members to fill your Following feed."}
              </p>
              {mode === "following" ? (
                <Link
                  href="/app/community"
                  onClick={onClose}
                  className="mt-4 inline-flex rounded-xl bg-[#305f33] px-4 py-2 text-xs font-bold text-white"
                >
                  {fr ? "À découvrir" : "Discover people"}
                </Link>
              ) : null}
            </div>
          ) : (
            <ul className="divide-y divide-[#f0f4f2]">
              {people.map((person) => (
                <li key={person.userId}>
                  <CommunityFollowUserRow
                    fr={fr}
                    person={person}
                    busy={busyHandle === person.handle}
                    hideFollow={person.isSelf}
                    onToggleFollow={
                      person.isSelf
                        ? undefined
                        : () => void toggleFollow(person)
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          {nextCursor ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void load(nextCursor, true)}
              className="my-3 w-full rounded-xl border border-[#e8f3ee] py-2.5 text-xs font-bold text-[#305f33] disabled:opacity-50"
            >
              {loading ? (fr ? "Chargement…" : "Loading…") : fr ? "Voir plus" : "Load more"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
