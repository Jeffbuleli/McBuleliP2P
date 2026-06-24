"use client";

import { useState } from "react";
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
  /** Pas de navigation — mosaic Facebook + lightbox inline. */
  feedInline?: boolean;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
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
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <CommunityImageMosaic
            images={images}
            postId={feedInline ? undefined : postId}
            feedInline={feedInline}
            onImageClick={feedInline ? (src) => setLightbox(src) : undefined}
          />
        </div>
        {lightbox ? (
          <div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal
          >
            <button
              type="button"
              className="absolute right-4 top-4 text-2xl text-white"
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox}
              alt=""
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
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
