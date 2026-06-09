"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  CommunityBadgeIcon,
  KycVerifiedBadge,
  ReputationLevelBadge,
} from "@/components/community/community-badges";
import type { PublicProfileView } from "@/lib/community/profile-service";
import type { BlogPostListItem } from "@/lib/community/blog-service";
import { REPUTATION_LEVELS } from "@/lib/community/reputation-levels";

export function CommunityPublicProfileClient({ handle }: { handle: string }) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [profile, setProfile] = useState<PublicProfileView | null>(null);
  const [blogs, setBlogs] = useState<BlogPostListItem[]>([]);
  const [notFound, setNotFound] = useState(false);

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

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-4">
      <Link href="/app/community" className="text-sm font-semibold text-[#305f33]">
        ← {fr ? "Communauté" : "Community"}
      </Link>

      <header className="mt-4 overflow-hidden rounded-2xl border border-[#f0f4f2] bg-white shadow-sm">
        <div className="bg-gradient-to-b from-[#e8f3ee] to-white px-4 pb-4 pt-6 text-center">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              className="mx-auto h-20 w-20 rounded-full border-2 border-white object-cover shadow-sm"
            />
          ) : (
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-[#e8f3ee] text-2xl font-bold text-[#305f33] shadow-sm">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <h1 className="mt-3 text-lg font-bold text-[#0c0a09]">
            {profile.displayName}
          </h1>
          <p className="mt-0.5 text-sm text-[#78716c]">@{profile.handle}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            {profile.showKycBadge ? <KycVerifiedBadge fr={fr} /> : null}
            <ReputationLevelBadge levelId={profile.reputationLevel} fr={fr} />
          </div>
        </div>
        <div className="px-4 pb-4">
          {profile.bio ? (
            <p className="text-center text-sm leading-relaxed text-[#57534e]">
              {profile.bio}
            </p>
          ) : null}
          {profile.badges.length > 0 ? (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {profile.badges.map((b) => (
                <span
                  key={b.slug}
                  className="inline-flex items-center gap-1 rounded-full bg-[#fafaf9] px-2 py-0.5 text-[10px] font-semibold text-[#57534e]"
                >
                  <CommunityBadgeIcon slug={b.slug} />
                  {fr ? b.labelFr : b.labelEn}
                </span>
              ))}
            </div>
          ) : null}
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-xl bg-[#fafafa] px-2 py-2 text-center">
              <dt className="text-[#a8a29e]">{fr ? "Publications" : "Posts"}</dt>
              <dd className="font-bold text-[#0c0a09]">{profile.postsCount}</dd>
            </div>
            <div className="rounded-xl bg-[#fafafa] px-2 py-2 text-center">
              <dt className="text-[#a8a29e]">{fr ? "Commentaires" : "Comments"}</dt>
              <dd className="font-bold text-[#0c0a09]">{profile.commentCount}</dd>
            </div>
            <div className="rounded-xl bg-[#fafafa] px-2 py-2 text-center">
              <dt className="text-[#a8a29e]">Blogs</dt>
              <dd className="font-bold text-[#0c0a09]">{profile.blogCount}</dd>
            </div>
            <div className="rounded-xl bg-[#fafafa] px-2 py-2 text-center">
              <dt className="text-[#a8a29e]">{fr ? "Score" : "Score"}</dt>
              <dd className="font-bold text-[#0c0a09]">{profile.reputationScore}</dd>
            </div>
          </dl>
          <p className="mt-3 text-center text-[10px] text-[#a8a29e]">
            {fr ? "Membre depuis" : "Member since"}{" "}
            {new Date(profile.memberSince).toLocaleDateString(fr ? "fr-FR" : "en-US", {
              month: "long",
              year: "numeric",
            })}
            {" · "}
            {REPUTATION_LEVELS.find((l) => l.id === profile.reputationLevel)?.[
              fr ? "labelFr" : "labelEn"
            ] ?? ""}
          </p>
        </div>
      </header>

      {blogs.length > 0 ? (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-bold text-[#0c0a09]">Blogs</h2>
          <ul className="space-y-2">
            {blogs.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/app/community/blogs/${b.slug}`}
                  className="fd-card block px-4 py-3 text-sm font-semibold text-[#0c0a09]"
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
