import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { normalizePublicMediaUrl } from "@/lib/media-url";
import { getPublicPostForShare } from "@/lib/community/feed-service";
import {
  communityPostAppPath,
  communityPostSharePath,
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

type Props = { params: Promise<{ id: string }> };

function shareOrigin(): string {
  return getMetadataOrigin() || CANONICAL_PRODUCTION_ORIGIN;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicPostForShare(id);
  const origin = shareOrigin();
  const url = `${origin}${communityPostSharePath(id)}`;

  if (!post) {
    return {
      title: "Publication introuvable",
      openGraph: { url, siteName: "McBuleli" },
    };
  }

  const title = `${post.authorDisplayName} (@${post.authorHandle}) · McBuleli`;
  const description =
    post.body.length > 200 ? `${post.body.slice(0, 197)}…` : post.body || title;
  const imageUrl = normalizePublicMediaUrl(post.imageUrl);
  const images = imageUrl
    ? [{ url: imageUrl, width: 1200, height: 630, alt: title }]
    : [{ url: `${origin}/opengraph-image`, width: 1200, height: 630 }];

  return {
    title,
    description,
    openGraph: {
      type: "article",
      url,
      siteName: "McBuleli",
      title,
      description,
      images,
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((img) => img.url),
    },
  };
}

export default async function CommunityPostSharePage({ params }: Props) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (userId) redirect(communityPostAppPath(id));

  const post = await getPublicPostForShare(id);
  const returnPath = post?.appReturnPath ?? communityPostAppPath(id);
  const loginHref = loginHrefFor(returnPath);
  const registerHref = registerHrefFor(returnPath);

  if (!post) {
    return (
      <CommunityPublicShareShell
        loginHref={loginHref}
        registerHref={registerHref}
        notFound
        notFoundLabel="Publication introuvable."
      >
        {null}
      </CommunityPublicShareShell>
    );
  }

  const mediaUrl = normalizePublicMediaUrl(post.imageUrl);
  const avatarUrl = normalizePublicMediaUrl(post.authorAvatarUrl);
  const initial = post.authorDisplayName.slice(0, 1).toUpperCase();
  const body =
    post.body.trim().length > 320
      ? `${post.body.trim().slice(0, 317)}…`
      : post.body.trim();
  const isVideo = post.mediaKind === "video";

  return (
    <CommunityPublicShareShell
      loginHref={loginHref}
      registerHref={registerHref}
      atmosphereUrl={mediaUrl}
      inviteHandle={post.authorHandle}
      secondaryCta="Voir la publication"
    >
      {mediaUrl ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0b1510]">
          {isVideo ? (
            <video
              src={mediaUrl}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
              controls={false}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="eager"
            />
          )}
          {isVideo ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#305f33] shadow-lg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="h-28 bg-gradient-to-br from-[#305f33] via-[#3d7340] to-[#1a3d1c]" />
      )}

      <div className="relative px-5 pt-0">
        <div className={`${mediaUrl ? "-mt-8" : "mt-5"} mb-3 flex items-end gap-3`}>
          <div className="rounded-full bg-white p-1 shadow-[0_8px_24px_rgba(12,10,9,0.18)]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#305f33] text-lg font-bold text-white">
                {initial}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <p className="truncate text-base font-extrabold text-[#0c0a09]">
              {post.authorDisplayName}
            </p>
            <Link
              href={`/community/u/${encodeURIComponent(post.authorHandle)}`}
              className="text-sm font-semibold text-[#305f33]"
            >
              @{post.authorHandle}
            </Link>
          </div>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#305f33]">
          {isVideo ? "Vidéo · McBuleli Community" : "Publication · McBuleli Community"}
        </p>

        {body ? (
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-[#44403c]">
            {body}
          </p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <div className="min-w-[4rem] flex-1 rounded-xl bg-[#f4f7f5] px-2.5 py-2 text-center ring-1 ring-[#e8f3ee]">
            <p className="text-base font-extrabold tabular-nums leading-none text-[#0c0a09]">
              {formatCompactCount(post.likeCount)}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#57534e]">
              Likes
            </p>
          </div>
          <div className="min-w-[4rem] flex-1 rounded-xl bg-[#f4f7f5] px-2.5 py-2 text-center ring-1 ring-[#e8f3ee]">
            <p className="text-base font-extrabold tabular-nums leading-none text-[#0c0a09]">
              {formatCompactCount(post.commentCount)}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#57534e]">
              Com.
            </p>
          </div>
          <div className="min-w-[4rem] flex-1 rounded-xl bg-[#f4f7f5] px-2.5 py-2 text-center ring-1 ring-[#e8f3ee]">
            <p className="text-base font-extrabold tabular-nums leading-none text-[#0c0a09]">
              {formatCompactCount(post.viewCount)}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#57534e]">
              Vues
            </p>
          </div>
        </div>
      </div>
    </CommunityPublicShareShell>
  );
}
