"use client";

import { CommunityImageMosaic } from "@/components/community/community-image-mosaic";
import { CommunityLinkEmbed } from "@/components/community/community-link-embed";
import { CommunityVideoPlayer } from "@/components/community/community-video-player";
import { findEmbeddableUrl } from "@/lib/community/link-embed";
import { communityImageVariant } from "@/lib/community/data-saver";

type Media = {
  id: string;
  url: string;
  variants: Record<string, string> | null;
  fileType?: string;
  mimeType?: string;
};

export function CommunityPostMedia({
  media,
  postType,
  body,
  fr,
}: {
  media: Media[];
  postType: string;
  body?: string;
  fr: boolean;
}) {
  const first = media[0];

  if (first) {
    const isVideo =
      postType === "video" ||
      first.fileType === "video" ||
      first.mimeType?.startsWith("video/");

    if (isVideo) {
      const poster = media[1]
        ? communityImageVariant(media[1].variants, media[1].url)
        : null;
      return (
        <div
          className="mt-3"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <CommunityVideoPlayer src={first.url} fr={fr} poster={poster} />
        </div>
      );
    }

    const images = media
      .map((m) => ({
        id: m.id,
        src: communityImageVariant(m.variants, m.url) ?? m.url,
      }))
      .filter((m) => m.src);

    if (!images.length) return null;

    return (
      <div className="mt-3">
        <CommunityImageMosaic images={images} />
      </div>
    );
  }

  if (body) {
    const embed = findEmbeddableUrl(body);
    if (embed) {
      return <CommunityLinkEmbed embed={embed} fr={fr} />;
    }
  }

  return null;
}
