"use client";

import { CommunityVideoPlayer } from "@/components/community/community-video-player";
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
  fr,
}: {
  media: Media[];
  postType: string;
  fr: boolean;
}) {
  const first = media[0];
  if (!first) return null;

  const isVideo =
    postType === "video" ||
    first.fileType === "video" ||
    first.mimeType?.startsWith("video/");

  if (isVideo) {
    const poster = media[1]
      ? communityImageVariant(media[1].variants, media[1].url)
      : null;
    return (
      <div className="mt-3">
        <CommunityVideoPlayer src={first.url} fr={fr} poster={poster} />
      </div>
    );
  }

  const imgSrc = communityImageVariant(first.variants, first.url);
  if (!imgSrc) return null;

  if (media.length >= 3) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl">
        <div className="row-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc} alt="" className="h-full min-h-[200px] w-full object-cover" />
        </div>
        {media.slice(1, 3).map((m) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={m.id}
            src={communityImageVariant(m.variants, m.url) ?? m.url}
            alt=""
            className="h-[100px] w-full object-cover"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgSrc} alt="" loading="lazy" className="max-h-80 w-full object-cover" />
    </div>
  );
}
