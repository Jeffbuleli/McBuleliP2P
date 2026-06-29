"use client";

import { useState } from "react";
import { CommunityImageLightbox } from "@/components/community/community-image-lightbox";
import { CommunityImageMosaic } from "@/components/community/community-image-mosaic";
import { CommunityLinkEmbed } from "@/components/community/community-link-embed";
import { CommunityVideoPlayer } from "@/components/community/community-video-player";
import { COMMUNITY_MEDIA_FRAME, COMMUNITY_VIDEO_FRAME } from "@/lib/community/community-ui";
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
  postId,
  feedInline = false,
}: {
  media: Media[];
  postType: string;
  body?: string;
  fr: boolean;
  postId?: string;
  /** Pas de navigation - mosaic Facebook + lightbox inline. */
  feedInline?: boolean;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
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
          className={`mt-3 ${COMMUNITY_VIDEO_FRAME}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <CommunityVideoPlayer src={first.url} fr={fr} poster={poster} variant="reels" />
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
      <>
        <div className={`mt-3 ${COMMUNITY_MEDIA_FRAME}`} onClick={(e) => e.stopPropagation()}>
          <CommunityImageMosaic
            images={images}
            postId={feedInline ? undefined : postId}
            feedInline={feedInline}
            onImageClick={feedInline ? (index) => setLightboxIndex(index) : undefined}
          />
        </div>
        {lightboxIndex !== null ? (
          <CommunityImageLightbox
            images={images}
            index={lightboxIndex}
            onIndexChange={setLightboxIndex}
            onClose={() => setLightboxIndex(null)}
            fr={fr}
          />
        ) : null}
      </>
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
