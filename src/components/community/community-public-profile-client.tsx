"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  AdminGoldBadge,
  BlueCheckBadge,
  CommunityBadgeIcon,
  KycVerifiedBadge,
  OnlineDot,
  ReputationLevelBadge,
} from "@/components/community/community-badges";
import { CommunityPostCard } from "@/components/community/community-post-card";
import type { FeedPostView } from "@/lib/community/feed-service";
import type { PublicProfileView } from "@/lib/community/profile-service";
import type { BlogPostListItem } from "@/lib/community/blog-service";
import { REPUTATION_LEVELS } from "@/lib/community/reputation-levels";

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-[#f0f4f2] bg-white px-3 py-3 text-center shadow-[0_2px_12px_rgba(12,10,9,0.04)]">
      <p className="text-lg font-bold tabular-nums text-[#0c0a09]">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#a8a29e]">
        {label}
      </p>
    </div>
  );
}

export function CommunityPublicProfileClient({ handle }: { handle: string }) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfileView | null>(null);
  const [blogs, setBlogs] = useState<BlogPostListItem[]>([]);
  const [posts, setPosts] = useState<FeedPostView[]>([]);
  const [postQ, setPostQ] = useState("");
  const [postsLoading, setPostsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/community/profiles/${handle}`)
      .then((r) => r.json())
      .then(async (d: { profile?: PublicProfileView; error?: string }) => {
        if (!d.profile) {
          setNotFound(true);
          return;
        }
        setProfile(d.profile);
        const br = await fetch(
          `/api/community/blogs?authorId=${d.profile.userId}&limit=5`,
        );
        const bj = await br.json();
        setBlogs((bj.posts ?? []) as BlogPostListItem[]);
      })
      .catch(() => setNotFound(true));
  }, [handle]);

  useEffect(() => {
    if (!profile) return;
    setPostsLoading(true);
    const q = postQ.trim();
    const url = `/api/community/profiles/${handle}/posts?limit=20${
      q ? `&q=${encodeURIComponent(q)}` : ""
    }`;
    fetch(url)
      .then((r) => r.json())
      .then((d: { posts?: FeedPostView[] }) => {
        setPosts(d.posts ?? []);
      })
      .finally(() => setPostsLoading(false));
  }, [handle, profile, postQ]);

  const toggleFollow = async () => {
    if (!profile || profile.isOwnProfile) return;
    setBusy(true);
    try {
      const method = profile.viewerFollows ? "DELETE" : "POST";
      const res = await fetch(
        `/api/community/traders/${profile.handle}/follow`,
        { method },
      );
      if (res.ok) {
        setProfile((p) =>
          p
            ? {
                ...p,
                viewerFollows: !p.viewerFollows,
                followerCount:
                  p.followerCount + (p.viewerFollows ? -1 : 1),
              }
            : p,
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const openMessage = async () => {
    if (!profile || profile.isOwnProfile) return;
    setBusy(true);
    try {
      const res = await fetch("/api/community/dm/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: profile.handle }),
      });
      const j = await res.json();
      if (res.ok && j.threadId) {
        router.push(`/app/community/inbox/${j.threadId}`);
      }
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <div className="community-theme mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-[#57534e]">
          {fr ? "Profil introuvable" : "Profile not found"}
        </p>
        <Link href="/app/community" className="mt-4 inline-block text-sm text-[#305f33]">
          ← {fr ? "Communauté" : "Community"}
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="community-theme mx-auto max-w-lg px-4 py-16 text-center text-sm text-[#78716c]">
        …
      </div>
    );
  }

  const levelLabel =
    REPUTATION_LEVELS.find((l) => l.id === profile.reputationLevel)?.[
      fr ? "labelFr" : "labelEn"
    ] ?? "";

  return (
    <div className="community-theme mx-auto w-full max-w-lg pb-28">
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <Link href="/app/community" className="text-sm font-semibold text-[#305f33]">
            ← {fr ? "Communauté" : "Community"}
          </Link>
          <Link
            href="/app/community/inbox"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0f7f3] text-[#305f33]"
            aria-label={fr ? "Messages" : "Inbox"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M22 12h-4l-3 9L9 3l-3 9H2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>

      <header className="relative mt-3 overflow-hidden rounded-3xl border border-[#f0f4f2] bg-white shadow-[0_8px_30px_rgba(12,10,9,0.06)]">
        <div
          className="h-28 w-full bg-gradient-to-br from-[#305f33] via-[#3d7340] to-[#1e3d20]"
          style={
            profile.coverUrl
              ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.45)), url(${profile.coverUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />
        <div className="-mt-12 px-4 pb-5">
          <div className="relative mx-auto w-fit">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-[#e8f3ee] text-3xl font-bold text-[#305f33] shadow-md">
                {profile.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <OnlineDot online={profile.online} />
          </div>

          <div className="mt-3 text-center">
            <h1 className="text-xl font-bold tracking-tight text-[#0c0a09]">
              {profile.displayName}
            </h1>
            <p className="mt-0.5 text-sm font-medium text-[#78716c]">
              @{profile.handle}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              {profile.isAdmin ? <AdminGoldBadge fr={fr} /> : null}
              {profile.showKycBadge ? <KycVerifiedBadge fr={fr} /> : null}
              {profile.verifiedBlue ? <BlueCheckBadge fr={fr} /> : null}
              <ReputationLevelBadge levelId={profile.reputationLevel} fr={fr} />
            </div>
          </div>

          {profile.bio ? (
            <p className="mt-3 whitespace-pre-wrap text-center text-sm leading-relaxed text-[#57534e]">
              {profile.bio}
            </p>
          ) : null}

          <div className="mt-4 flex justify-center gap-8 text-center">
            <div>
              <p className="text-base font-bold text-[#0c0a09]">
                {profile.followerCount}
              </p>
              <p className="text-[11px] text-[#a8a29e]">
                {fr ? "Abonnés" : "Followers"}
              </p>
            </div>
            <div>
              <p className="text-base font-bold text-[#0c0a09]">
                {profile.followingCount}
              </p>
              <p className="text-[11px] text-[#a8a29e]">
                {fr ? "Abonnements" : "Following"}
              </p>
            </div>
          </div>

          {!profile.isOwnProfile ? (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void toggleFollow()}
                className={`min-h-[44px] flex-1 rounded-xl text-sm font-bold active:scale-[0.98] disabled:opacity-50 ${
                  profile.viewerFollows
                    ? "border border-[#e8f3ee] bg-white text-[#305f33]"
                    : "bg-[#305f33] text-white shadow-sm"
                }`}
              >
                {profile.viewerFollows
                  ? fr
                    ? "Abonné"
                    : "Following"
                  : fr
                    ? "Suivre"
                    : "Follow"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void openMessage()}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#e8f3ee] bg-[#fafaf9] text-sm font-bold text-[#305f33] active:scale-[0.98] disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {fr ? "Message" : "Message"}
              </button>
            </div>
          ) : null}

          <p className="mt-4 text-center text-[10px] text-[#a8a29e]">
            {fr ? "Membre depuis" : "Member since"}{" "}
            {new Date(profile.memberSince).toLocaleDateString(
              fr ? "fr-FR" : "en-US",
              { month: "long", year: "numeric" },
            )}
            {levelLabel ? ` · ${levelLabel}` : ""}
          </p>
        </div>
      </header>

      <section className="mt-4 grid grid-cols-3 gap-2 px-4">
        <StatCard label={fr ? "Publications" : "Posts"} value={profile.postsCount} />
        <StatCard
          label={fr ? "Commentaires" : "Comments"}
          value={profile.commentCount}
        />
        <StatCard
          label={fr ? "Réputation" : "Reputation"}
          value={profile.reputationScore}
        />
      </section>

      {profile.badges.length > 0 ? (
        <section className="mt-4 px-4">
          <div className="flex flex-wrap gap-1.5">
            {profile.badges.map((b) => (
              <span
                key={b.slug}
                className="inline-flex items-center gap-1 rounded-full border border-[#f0f4f2] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#57534e] shadow-sm"
              >
                <CommunityBadgeIcon slug={b.slug} />
                {fr ? b.labelFr : b.labelEn}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-5 px-4">
        <h2 className="mb-2 text-sm font-bold text-[#0c0a09]">
          {fr ? "Publications" : "Posts"}
        </h2>
        <input
          type="search"
          value={postQ}
          onChange={(e) => setPostQ(e.target.value)}
          placeholder={
            fr ? "Rechercher dans les publications…" : "Search posts…"
          }
          className="mb-3 w-full rounded-xl border border-[#e8f3ee] bg-white px-3 py-2 text-sm"
        />
        {postsLoading ? (
          <p className="text-center text-sm text-[#78716c]">…</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-sm text-[#78716c]">
            {fr ? "Aucune publication" : "No posts yet"}
          </p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                onUpdate={(patch) =>
                  setPosts((list) =>
                    list.map((p) => (p.id === post.id ? { ...p, ...patch } : p)),
                  )
                }
                onRemove={() =>
                  setPosts((list) => list.filter((p) => p.id !== post.id))
                }
              />
            ))}
          </div>
        )}
      </section>

      {blogs.length > 0 ? (
        <section className="mt-5 px-4">
          <h2 className="mb-2 text-sm font-bold text-[#0c0a09]">Blogs</h2>
          <ul className="space-y-2">
            {blogs.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/app/community/blogs/${b.slug}`}
                  className="block rounded-2xl border border-[#f0f4f2] bg-white px-4 py-3 text-sm font-semibold text-[#0c0a09] shadow-[0_2px_12px_rgba(12,10,9,0.04)]"
                >
                  {b.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
