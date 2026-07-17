import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { normalizePublicMediaUrl } from "@/lib/media-url";
import { getPublicStoryForShare } from "@/lib/community/stories-service";
import {
  communityStoryAppPath,
  communityStorySharePath,
} from "@/lib/community/share-url";
import { loginHrefFor, registerHrefFor } from "@/lib/auth-return-path";
import {
  CANONICAL_PRODUCTION_ORIGIN,
  getMetadataOrigin,
} from "@/lib/app-url";
import { getSessionUserId } from "@/lib/session";
import { CommunityPublicShareShell } from "@/components/community/community-public-share-shell";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function shareOrigin(): string {
  return getMetadataOrigin() || CANONICAL_PRODUCTION_ORIGIN;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const story = await getPublicStoryForShare(id);
  const origin = shareOrigin();
  const url = `${origin}${communityStorySharePath(id)}`;

  if (!story) {
    return {
      title: "Statut introuvable",
      openGraph: { url, siteName: "McBuleli" },
    };
  }

  const title = story.expired
    ? `Statut expiré · @${story.authorHandle}`
    : `${story.authorDisplayName} (@${story.authorHandle}) · Statut`;
  const description =
    story.body?.trim() ||
    (story.expired
      ? "Ce statut 24h a expiré sur McBuleli."
      : `Statut de @${story.authorHandle} sur McBuleli Community`);
  const imageUrl =
    normalizePublicMediaUrl(story.mediaUrl) ||
    normalizePublicMediaUrl(story.authorAvatarUrl);
  const images = imageUrl
    ? [{ url: imageUrl, width: 1200, height: 630, alt: title }]
    : [{ url: `${origin}/opengraph-image`, width: 1200, height: 630 }];

  return {
    title: `${title} · McBuleli`,
    description,
    openGraph: {
      type: "article",
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

export default async function CommunityStorySharePage({ params }: Props) {
  const { id } = await params;
  const story = await getPublicStoryForShare(id);
  const returnPath = story?.appReturnPath ?? communityStoryAppPath(id);
  const userId = await getSessionUserId();
  if (userId) redirect(returnPath);

  const loginHref = loginHrefFor(returnPath);
  const registerHref = registerHrefFor(returnPath);

  if (!story) {
    return (
      <CommunityPublicShareShell
        loginHref={loginHref}
        registerHref={registerHref}
        notFound
        notFoundLabel="Statut introuvable ou expiré."
      >
        {null}
      </CommunityPublicShareShell>
    );
  }

  const mediaUrl = normalizePublicMediaUrl(story.mediaUrl);
  const avatarUrl = normalizePublicMediaUrl(story.authorAvatarUrl);
  const initial = story.authorDisplayName.slice(0, 1).toUpperCase();
  const body =
    story.body?.trim() && story.body.trim().length > 280
      ? `${story.body.trim().slice(0, 277)}…`
      : story.body?.trim() || null;

  return (
    <CommunityPublicShareShell
      loginHref={loginHref}
      registerHref={registerHref}
      atmosphereUrl={mediaUrl || avatarUrl}
      inviteHandle={story.authorHandle}
      secondaryCta={
        story.expired ? "Voir le profil" : "Voir le statut"
      }
    >
      <div
        className="relative flex min-h-[280px] flex-col justify-end overflow-hidden"
        style={
          story.type === "text"
            ? { backgroundColor: story.bgColor || "#305f33" }
            : undefined
        }
      >
        {mediaUrl && story.type !== "text" ? (
          story.type === "video" ? (
            <video
              src={mediaUrl}
              className="absolute inset-0 h-full w-full object-cover"
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
              className="absolute inset-0 h-full w-full object-cover"
            />
          )
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="relative z-[1] p-5">
          <div className="mb-3 flex items-center gap-2">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover ring-2 ring-white/40"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white ring-2 ring-white/40">
                {initial}
              </span>
            )}
            <div>
              <p className="text-sm font-bold text-white">
                {story.authorDisplayName}
              </p>
              <p className="text-[11px] text-white/75">@{story.authorHandle}</p>
            </div>
          </div>
          {story.expired ? (
            <p className="rounded-xl bg-black/35 px-3 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm">
              Ce statut 24h a expiré.
            </p>
          ) : body ? (
            <p className="text-base font-semibold leading-snug text-white drop-shadow">
              {body}
            </p>
          ) : null}
        </div>
      </div>
    </CommunityPublicShareShell>
  );
}
