"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CommunityAvatar } from "@/components/community/community-avatar";
import type { FollowGraphPerson } from "@/lib/community/follows-service";
import {
  DISCOVER_VISIBLE_SLOTS,
  dismissDiscoverPerson,
  getDiscoverExcludeUserIds,
  isDiscoverBlockSnoozed,
  noteDiscoverShown,
  snoozeDiscoverBlock,
} from "@/lib/community/discover-dismiss";

function suggestionHint(person: FollowGraphPerson, fr: boolean): string {
  if (person.followsYou || person.reason === "mutual") {
    return fr ? "Vous suit" : "Follows you";
  }
  if (person.reason === "engaged") {
    return fr ? "Tu interagis avec ses posts" : "You engage with their posts";
  }
  if (person.reason === "taste") {
    return fr ? "Contenus proches de toi" : "Content close to your taste";
  }
  if (person.reason === "circle") {
    return fr ? "Suivi par tes abonnements" : "Followed by people you follow";
  }
  if (person.reason === "nearby") {
    return fr ? "Près de toi" : "Near you";
  }
  if (person.reason === "active") {
    return fr ? "Actif·ve récemment" : "Recently active";
  }
  return fr ? "À découvrir" : "Suggested";
}

function followCta(person: FollowGraphPerson, fr: boolean): string {
  if (person.followsYou || person.reason === "mutual") {
    return "Follow back";
  }
  return "Follow";
}

export function CommunityDiscoverPeople({
  fr,
  compact = false,
}: {
  fr: boolean;
  compact?: boolean;
}) {
  const [queue, setQueue] = useState<FollowGraphPerson[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [snoozeHint, setSnoozeHint] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (typeof window !== "undefined" && isDiscoverBlockSnoozed()) {
      setHidden(true);
      setLoaded(true);
      setQueue([]);
      return;
    }
    try {
      const excluded = getDiscoverExcludeUserIds();
      const q = new URLSearchParams({ limit: "14" });
      if (excluded.length) q.set("exclude", excluded.join(","));
      const res = await fetch(`/api/community/discover/people?${q}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        setQueue([]);
        return;
      }
      const data = (await res.json()) as { people?: FollowGraphPerson[] };
      const next = (data.people ?? []).filter((p) => !p.isFollowing && !p.isSelf);
      setQueue(next);
      if (next.length > 0) noteDiscoverShown();
    } catch {
      setQueue([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => queue.slice(0, DISCOVER_VISIBLE_SLOTS),
    [queue],
  );

  const removeFromQueue = (userId: string) => {
    setQueue((list) => list.filter((p) => p.userId !== userId));
  };

  const onIgnore = (person: FollowGraphPerson) => {
    dismissDiscoverPerson(person.userId);
    removeFromQueue(person.userId);
  };

  const onFollow = async (person: FollowGraphPerson) => {
    setBusyId(person.userId);
    try {
      const res = await fetch(`/api/community/traders/${person.handle}/follow`, {
        method: "POST",
      });
      if (!res.ok) return;
      dismissDiscoverPerson(person.userId);
      removeFromQueue(person.userId);
    } finally {
      setBusyId(null);
    }
  };

  const onLater = () => {
    const { hours } = snoozeDiscoverBlock(visible.map((p) => p.userId));
    setSnoozeHint(
      fr
        ? `On te proposera d'autres profils dans ~${hours} h`
        : `We'll suggest other people in ~${hours}h`,
    );
    setHidden(true);
    setQueue([]);
    window.setTimeout(() => setSnoozeHint(null), 4500);
  };

  if (snoozeHint && hidden) {
    return (
      <div className="mb-3 rounded-2xl border border-dashed border-[#dce8e0] bg-[#f7fbf8] px-3 py-2.5 text-center text-[11px] text-[#78716c]">
        {snoozeHint}
      </div>
    );
  }

  if (!loaded || hidden || visible.length === 0) return null;

  return (
    <section
      className={`mb-3 overflow-hidden rounded-2xl border border-[#e8f3ee] bg-gradient-to-b from-[#f7fbf8] to-white ${
        compact ? "shadow-none" : "shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-3 pb-0.5 pt-2.5">
        <div className="min-w-0">
          <h2 className="text-[13px] font-extrabold text-[#0c0a09]">
            {fr ? "Suggestions" : "Suggestions"}
          </h2>
          <p className="text-[10px] leading-snug text-[#78716c]">
            {fr
              ? "Selon tes interactions et goûts - Later = plus tard, pas exclus."
              : "Based on your interactions & taste - Later pauses, doesn't exclude."}
          </p>
        </div>
        <button
          type="button"
          onClick={onLater}
          className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold text-[#a8a29e] hover:bg-[#f0f4f2] hover:text-[#57534e]"
          title={
            fr
              ? "Masquer un moment, d'autres profils reviendront"
              : "Hide for a while - other profiles will return"
          }
        >
          {fr ? "Plus tard" : "Later"}
        </button>
      </div>

      <ul className="px-2 pb-2 pt-1">
        {visible.map((person) => (
          <li
            key={person.userId}
            className="flex items-center gap-2.5 rounded-xl px-1.5 py-2"
          >
            <Link
              href={`/app/community/u/${person.handle}`}
              className="shrink-0"
            >
              <CommunityAvatar
                label={person.displayName}
                avatarUrl={person.avatarUrl}
                sizeClass="h-10 w-10"
                className="ring-2 ring-white"
              />
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href={`/app/community/u/${person.handle}`}
                className="block truncate text-[13px] font-bold text-[#0c0a09] hover:underline"
              >
                {person.displayName}
              </Link>
              <p className="truncate text-[10px] text-[#78716c]">
                @{person.handle}
                <span className="text-[#a8a29e]"> · </span>
                <span className="font-semibold text-[#305f33]">
                  {suggestionHint(person, fr)}
                </span>
              </p>
            </div>

            <button
              type="button"
              disabled={busyId === person.userId}
              onClick={() => void onFollow(person)}
              className="min-h-[32px] shrink-0 rounded-lg bg-[#305f33] px-2.5 text-[10px] font-bold text-white shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              {followCta(person, fr)}
            </button>

            <button
              type="button"
              onClick={() => onIgnore(person)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#a8a29e] hover:bg-[#f0f4f2] hover:text-[#57534e] active:scale-95"
              aria-label={fr ? "Ignorer" : "Ignore"}
              title={fr ? "Ignorer 7 jours" : "Ignore for 7 days"}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
