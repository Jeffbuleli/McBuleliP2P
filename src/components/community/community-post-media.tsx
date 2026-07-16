"use client";

import { useState } from "react";
import { CommunityImageLightbox } from "@/components/community/community-image-lightbox";
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
  postId,
  feedInline = false,
}: {
  media: Media[];
  postType: string;
  body?: string;
  fr: boolean;
  postId?: string;
  /** Pas de navigation - mosaic + lightbox inline. */
  feedInline?: boolean;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const first = media[0];
  const embed = body ? findEmbeddableUrl(body) : null;

  const videoMedia = first
    ? postType === "video" ||
      first.fileType === "video" ||
      first.mimeType?.startsWith("video/")
    : false;

  if (videoMedia && first) {
    const poster = media[1]
      ? communityImageVariant(media[1].variants, media[1].url)
      : null;
    return (
      <div
        className="mt-3"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <CommunityVideoPlayer
          src={first.url}
          fr={fr}
          poster={poster}
          variant="reels"
        />
      </div>
    );
  }

  const images = media
    .filter(
      (m) =>
        !(
          m.fileType === "video" ||
          m.mimeType?.startsWith("video/")
        ),
    )
    .map((m) => ({
      id: m.id,
      src: communityImageVariant(m.variants, m.url) ?? m.url,
    }))
    .filter((m) => m.src);

  return (
    <>
      {images.length > 0 ? (
        <>
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <CommunityImageMosaic
              images={images}
              postId={feedInline ? undefined : postId}
              feedInline={feedInline}
              onImageClick={
                feedInline ? (index) => setLightboxIndex(index) : undefined
              }
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
      ) : null}
      {embed ? <CommunityLinkEmbed embed={embed} fr={fr} /> : null}
    </>
  );
}
