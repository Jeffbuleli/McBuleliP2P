"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CommunityFollowUserRow } from "@/components/community/community-follow-user-row";
import type { FollowGraphPerson } from "@/lib/community/follows-service";

export function CommunityDiscoverPeople({ fr }: { fr: boolean }) {
  const [people, setPeople] = useState<FollowGraphPerson[]>([]);
  const [busyHandle, setBusyHandle] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/community/discover/people?limit=10", {
        cache: "no-store",
      });
      if (res.status === 401) {
        setPeople([]);
        return;
      }
      const data = (await res.json()) as { people?: FollowGraphPerson[] };
      setPeople(data.people ?? []);
    } catch {
      setPeople([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFollow = async (person: FollowGraphPerson) => {
    setBusyHandle(person.handle);
    try {
      const method = person.isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/community/traders/${person.handle}/follow`, {
        method,
      });
      if (!res.ok) return;
      if (!person.isFollowing) {
        setPeople((list) => list.filter((p) => p.handle !== person.handle));
      } else {
        setPeople((list) =>
          list.map((p) =>
            p.handle === person.handle ? { ...p, isFollowing: false } : p,
          ),
        );
      }
    } finally {
      setBusyHandle(null);
    }
  };

  if (!loaded || people.length === 0) return null;

  return (
    <section className="mb-3 overflow-hidden rounded-2xl border border-[#e8f3ee] bg-gradient-to-b from-[#f7fbf8] to-white">
      <div className="flex items-center justify-between gap-2 px-3.5 pb-1 pt-3">
        <div>
          <h2 className="text-sm font-extrabold text-[#0c0a09]">
            {fr ? "À découvrir" : "Discover people"}
          </h2>
          <p className="text-[10px] leading-snug text-[#78716c]">
            {fr
              ? "Membres actifs, proches de toi, ou qui te suivent déjà."
              : "Active members near you, or people who already follow you."}
          </p>
        </div>
        <Link
          href="/app/community/traders"
          className="shrink-0 text-[10px] font-bold text-[#305f33]"
        >
          {fr ? "Classement" : "Leaderboard"}
        </Link>
      </div>

      <ul className="divide-y divide-[#f0f4f2] px-2.5 pb-2">
        {people.slice(0, 6).map((person) => (
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
    </section>
  );
}
