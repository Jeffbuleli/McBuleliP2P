"use client";

import { useCallback, useEffect, useState } from "react";
import { CommunityFollowUserRow } from "@/components/community/community-follow-user-row";
import type { FollowGraphPerson } from "@/lib/community/follows-service";

type Mode = "followers" | "following";

export function CommunityFollowListSheet({
  open,
  onClose,
  fr,
  handle,
  mode,
  onCountsChange,
}: {
  open: boolean;
  onClose: () => void;
  fr: boolean;
  handle: string;
  mode: Mode;
  onCountsChange?: (delta: { followers?: number; following?: number }) => void;
}) {
  const [people, setPeople] = useState<FollowGraphPerson[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyHandle, setBusyHandle] = useState<string | null>(null);

  const load = useCallback(
    async (cursor?: string | null, append = false) => {
      setLoading(true);
      try {
        const q = new URLSearchParams({ limit: "40" });
        if (cursor) q.set("cursor", cursor);
        const res = await fetch(
          `/api/community/profiles/${encodeURIComponent(handle)}/${mode}?${q}`,
          { cache: "no-store" },
        );
        const data = (await res.json()) as {
          people?: FollowGraphPerson[];
          nextCursor?: string | null;
        };
        const batch = data.people ?? [];
        setPeople((prev) => (append ? [...prev, ...batch] : batch));
        setNextCursor(data.nextCursor ?? null);
      } finally {
        setLoading(false);
      }
    },
    [handle, mode],
  );

  useEffect(() => {
    if (!open) return;
    setPeople([]);
    setNextCursor(null);
    void load(null, false);
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

  const title =
    mode === "followers"
      ? fr
        ? "Abonnés"
        : "Followers"
      : fr
        ? "Abonnements"
        : "Following";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="follow-list-title"
        className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-[1.75rem] border border-[#e8f3ee] bg-white shadow-xl sm:rounded-[1.75rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-[#e8f3ee] px-4 py-3">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#d6d3d1] sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2
                id="follow-list-title"
                className="text-base font-extrabold text-[#0c0a09]"
              >
                {title}
              </h2>
              <p className="text-[11px] text-[#78716c]">@{handle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8f3ee] text-[#78716c] active:scale-95"
              aria-label={fr ? "Fermer" : "Close"}
            >
              ×
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-1">
          {loading && people.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-[#a8a29e]">…</p>
          ) : people.length === 0 ? (
            <p className="px-2 py-10 text-center text-sm text-[#78716c]">
              {mode === "followers"
                ? fr
                  ? "Pas encore d'abonnés. Partage ton profil pour tisser des liens."
                  : "No followers yet. Share your profile to build connections."
                : fr
                  ? "Aucun abonnement. Découvre des membres actifs dans la communauté."
                  : "Not following anyone yet. Discover active members in the community."}
            </p>
          ) : (
            <ul className="divide-y divide-[#f0f4f2]">
              {people.map((person) => (
                <li key={person.userId}>
                  <CommunityFollowUserRow
                    fr={fr}
                    person={person}
                    busy={busyHandle === person.handle}
                    onToggleFollow={() => void toggleFollow(person)}
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
              {loading
                ? "…"
                : fr
                  ? "Voir plus"
                  : "Load more"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
