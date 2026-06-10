"use client";

import Link from "next/link";

export type MosaicImage = {
  id: string;
  src: string;
};

export function CommunityImageMosaic({
  images,
  editable = false,
  onRemove,
  onReplace,
  postId,
  className = "",
}: {
  images: MosaicImage[];
  editable?: boolean;
  onRemove?: (id: string) => void;
  onReplace?: (id: string) => void;
  /** When set, each tile links to the individual media page. */
  postId?: string;
  className?: string;
}) {
  if (!images.length) return null;

  const slot = (img: MosaicImage, slotClass: string) => {
    const inner = (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt="" className="h-full w-full object-cover" />
        {postId && !editable ? (
          <span className="absolute inset-0 bg-black/0 transition hover:bg-black/10" />
        ) : null}
      </>
    );

    const tile = (
      <div className={`relative overflow-hidden ${slotClass}`}>
        {postId && !editable ? (
          <Link
            href={`/app/community/post/${postId}/media/${img.id}`}
            className="block h-full w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {inner}
          </Link>
        ) : (
          inner
        )}
      {editable ? (
        <>
          <button
            type="button"
            aria-label="Remove"
            onClick={() => onRemove?.(img.id)}
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-xs font-bold text-white"
          >
            ×
          </button>
          <button
            type="button"
            aria-label="Replace"
            onClick={() => onReplace?.(img.id)}
            className="absolute bottom-1 right-1 rounded-md bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold text-white"
          >
            ↻
          </button>
        </>
      ) : null}
      </div>
    );
    return <div key={img.id}>{tile}</div>;
  };

  if (images.length === 1) {
    return (
      <div className={`overflow-hidden rounded-xl ${className}`}>
        {slot(images[0], "max-h-80 min-h-[160px] w-full")}
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className={`grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl ${className}`}>
        {images.map((img) => slot(img, "min-h-[140px]"))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className={`grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl ${className}`}>
        {slot(images[0], "row-span-2 min-h-[200px]")}
        {slot(images[1], "min-h-[100px]")}
        {slot(images[2], "min-h-[100px]")}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl ${className}`}>
      {images.slice(0, 4).map((img) => slot(img, "min-h-[120px]"))}
    </div>
  );
}
