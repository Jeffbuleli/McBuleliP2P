import type { Metadata } from "next";
import Image from "next/image";
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
import { CommunityPoweredByStrip } from "@/components/community/community-powered-by-strip";

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
      <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#0c1a0e] px-4 py-12 text-center">
        <p className="text-sm text-white/70">Profil introuvable.</p>
        <Link href="/" className="mt-4 text-sm font-semibold text-[#9dcc9f]">
          mcbuleli.org
        </Link>
        <div className="mt-10">
          <CommunityPoweredByStrip onDark />
        </div>
      </main>
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
    <main className="relative min-h-dvh overflow-hidden bg-[#0b1510] text-white">
      {/* Immersive atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full scale-110 object-cover opacity-40 blur-2xl"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1510]/40 via-[#0b1510]/75 to-[#0b1510]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(48,95,51,0.35),_transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8 pt-5">
        <header className="mb-5 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#eaf5ee] ring-1 ring-white/20">
              <Image
                src="/brand/logo-256.png"
                alt="McBuleli"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                unoptimized
              />
            </span>
            <span className="text-sm font-extrabold tracking-tight text-white">
              McBuleli
            </span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Link
              href={loginHref}
              className="rounded-full px-3 py-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              Connexion
            </Link>
            <Link
              href={registerHref}
              className="rounded-full bg-white px-3 py-1.5 font-bold text-[#1a3d1c]"
            >
              Créer un compte
            </Link>
          </div>
        </header>

        <article className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/95 text-[#0c0a09] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          {/* Cover — clipped alone so avatar ring doesn't scar the banner */}
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

          <div className="relative px-5 pb-6 pt-0">
            {/* Avatar sits on the seam with a soft pad — no thick white scar on cover */}
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
                    {profile.followerCount}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#57534e]">
                    Abonnés
                  </p>
                </div>
                <div className="min-w-[4.25rem] rounded-xl bg-[#f4f7f5] px-2.5 py-2 text-center ring-1 ring-[#e8f3ee]">
                  <p className="text-lg font-extrabold tabular-nums leading-none text-[#0c0a09]">
                    {profile.postsCount}
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
            <p className="text-sm font-semibold text-[#57534e]">
              @{profile.handle}
            </p>

            {bio ? (
              <p className="mt-3 text-[15px] leading-relaxed text-[#44403c]">
                {bio}
              </p>
            ) : null}

            <div className="mt-5 rounded-2xl bg-[#eaf5ee] px-4 py-3.5 ring-1 ring-[#305f33]/15">
              <p className="text-[13px] font-semibold leading-snug text-[#1a3d1c]">
                Rejoignez une communauté P2P, Trading Crypto et Builders
                Innovants - comme{" "}
                <span className="font-extrabold">@{profile.handle}</span>
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              <Link
                href={registerHref}
                className="flex min-h-[52px] items-center justify-center rounded-2xl bg-[#305f33] text-[15px] font-extrabold text-white shadow-[0_10px_28px_rgba(48,95,51,0.35)] transition active:scale-[0.99]"
              >
                Créer un compte gratuit
              </Link>
              <Link
                href={loginHref}
                className="flex min-h-[48px] items-center justify-center rounded-2xl border border-[#dce8e0] bg-white text-sm font-bold text-[#305f33] transition active:scale-[0.99]"
              >
                Voir le profil
              </Link>
            </div>
          </div>
        </article>

        <div className="mt-auto pt-8">
          <CommunityPoweredByStrip onDark />
        </div>
      </div>
    </main>
  );
}
