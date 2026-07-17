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
import { CommunityShareAuthLinks } from "@/components/community/community-share-auth-links";
import {
  CANONICAL_PRODUCTION_ORIGIN,
  getMetadataOrigin,
} from "@/lib/app-url";
import { getSessionUserId } from "@/lib/session";

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
  const imageUrl = cover || avatar;
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
      card: "summary_large_image",
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
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-sm text-stone-600">Profil introuvable.</p>
        <Link href="/" className="mt-4 text-sm font-semibold text-[#305f33]">
          mcbuleli.org
        </Link>
      </main>
    );
  }

  const coverUrl = normalizePublicMediaUrl(profile.coverUrl);
  const avatarUrl = normalizePublicMediaUrl(profile.avatarUrl);

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-[#fafaf9] px-4 py-8">
      <div className="mb-4">
        <CommunityShareAuthLinks returnPath={returnPath} />
      </div>
      <article className="overflow-hidden rounded-2xl border border-[#e8f3ee] bg-white shadow-sm">
        {coverUrl ? (
          <div className="relative aspect-[3/1] w-full bg-[#e8f3ee]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="h-16 bg-gradient-to-r from-[#e8f3ee] to-[#f0faf4]" />
        )}
        <div className="relative px-5 pb-5 pt-10">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="absolute -top-8 left-5 h-16 w-16 rounded-full border-4 border-white object-cover shadow-sm"
            />
          ) : (
            <div className="absolute -top-8 left-5 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[#305f33] text-lg font-bold text-white shadow-sm">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <p className="text-xs font-bold uppercase tracking-wide text-[#305f33]">
            McBuleli Community
          </p>
          <h1 className="mt-1 text-lg font-bold text-[#0c0a09]">
            {profile.displayName}
          </h1>
          <p className="text-sm font-semibold text-[#78716c]">@{profile.handle}</p>
          {profile.bio ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#44403c]">
              {profile.bio.length > 280
                ? `${profile.bio.slice(0, 277)}…`
                : profile.bio}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-[#a8a29e]">
            {profile.followerCount} abonnés · {profile.postsCount} posts
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={loginHref}
              className="flex min-h-[48px] items-center justify-center rounded-xl bg-[#305f33] text-sm font-bold text-white"
            >
              Voir le profil
            </Link>
            <Link
              href={registerHref}
              className="flex min-h-[44px] items-center justify-center rounded-xl border border-[#dce8e0] text-sm font-semibold text-[#305f33]"
            >
              Créer un compte gratuit
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
