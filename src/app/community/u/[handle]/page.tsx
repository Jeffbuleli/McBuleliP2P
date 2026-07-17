import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { normalizePublicMediaUrl } from "@/lib/media-url";
import { getPublicProfileForShare } from "@/lib/community/profile-service";
import {
  communityProfileAppPath,
  communityProfileSharePath,
} from "@/lib/community/share-url";
import { loginHrefFor, registerHrefFor } from "@/lib/auth-return-path";
import {
  CANONICAL_PRODUCTION_ORIGIN,
  getMetadataOrigin,
} from "@/lib/app-url";
import { getSessionUserId } from "@/lib/session";
import { CommunityPublicShareShell } from "@/components/community/community-public-share-shell";
import { formatCompactCount } from "@/lib/community/format-count";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ handle: string }> };

function shareOrigin(): string {
  return getMetadataOrigin() || CANONICAL_PRODUCTION_ORIGIN;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle: raw } = await params;
  const handle = decodeURIComponent(raw);
  const profile = await getPublicProfileForShare(handle);
  const origin = shareOrigin();
  const url = `${origin}${communityProfileSharePath(handle)}`;

  if (!profile) {
    return {
      title: "Profil introuvable",
      openGraph: { url, siteName: "McBuleli" },
    };
  }

  const title = `${profile.displayName} (@${profile.handle}) · McBuleli`;
  const description =
    profile.bio?.trim() ||
    `${profile.followerCount} abonnés · ${profile.postsCount} posts sur McBuleli Community`;
  const cover = normalizePublicMediaUrl(profile.coverUrl);
  const avatar = normalizePublicMediaUrl(profile.avatarUrl);
  // RS preview: prefer avatar (identity), not cover banner.
  const imageUrl = avatar || cover;
  const images = imageUrl
    ? [{ url: imageUrl, width: 1200, height: 630, alt: title }]
    : [{ url: `${origin}/opengraph-image`, width: 1200, height: 630 }];

  return {
    title,
    description,
    openGraph: {
      type: "profile",
      url,
      siteName: "McBuleli",
      title,
      description,
      images,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: images.map((img) => img.url),
    },
  };
}

export default async function CommunityProfileSharePage({ params }: Props) {
  const { handle: raw } = await params;
  const handle = decodeURIComponent(raw);
  const userId = await getSessionUserId();
  if (userId) redirect(communityProfileAppPath(handle));

  const profile = await getPublicProfileForShare(handle);
  const returnPath = profile?.appReturnPath ?? communityProfileAppPath(handle);
  const loginHref = loginHrefFor(returnPath);
  const registerHref = registerHrefFor(returnPath);

  if (!profile) {
    return (
      <CommunityPublicShareShell
        loginHref={loginHref}
        registerHref={registerHref}
        notFound
        notFoundLabel="Profil introuvable."
      >
        {null}
      </CommunityPublicShareShell>
    );
  }

  const coverUrl = normalizePublicMediaUrl(profile.coverUrl);
  const avatarUrl = normalizePublicMediaUrl(profile.avatarUrl);
  const initial = profile.displayName.slice(0, 1).toUpperCase();
  const bio =
    profile.bio?.trim() &&
    (profile.bio.length > 220
      ? `${profile.bio.slice(0, 217)}…`
      : profile.bio);

  return (
    <CommunityPublicShareShell
      loginHref={loginHref}
      registerHref={registerHref}
      atmosphereUrl={coverUrl || avatarUrl}
      inviteHandle={profile.handle}
      secondaryCta="Voir le profil"
    >
      <div className="relative h-44 w-full overflow-hidden sm:h-52">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#305f33] via-[#3d7340] to-[#1a3d1c]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
      </div>

      <div className="relative px-5 pt-0">
        <div className="-mt-11 mb-3 flex items-end justify-between gap-3">
          <div className="rounded-full bg-white p-1 shadow-[0_8px_24px_rgba(12,10,9,0.18)]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-[4.75rem] w-[4.75rem] rounded-full object-cover"
              />
            ) : (
              <div className="flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full bg-[#305f33] text-2xl font-bold text-white">
                {initial}
              </div>
            )}
          </div>
          <div className="mb-1 flex gap-2 pb-1">
            <div className="min-w-[4.25rem] rounded-xl bg-[#f4f7f5] px-2.5 py-2 text-center ring-1 ring-[#e8f3ee]">
              <p className="text-lg font-extrabold tabular-nums leading-none text-[#0c0a09]">
                {formatCompactCount(profile.followerCount)}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#57534e]">
                Abonnés
              </p>
            </div>
            <div className="min-w-[4.25rem] rounded-xl bg-[#f4f7f5] px-2.5 py-2 text-center ring-1 ring-[#e8f3ee]">
              <p className="text-lg font-extrabold tabular-nums leading-none text-[#0c0a09]">
                {formatCompactCount(profile.postsCount)}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#57534e]">
                Posts
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#305f33]">
          McBuleli Community
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0c0a09]">
          {profile.displayName}
        </h1>
        <p className="text-sm font-semibold text-[#57534e]">@{profile.handle}</p>

        {bio ? (
          <p className="mt-3 text-[15px] leading-relaxed text-[#44403c]">{bio}</p>
        ) : null}
      </div>
    </CommunityPublicShareShell>
  );
}
