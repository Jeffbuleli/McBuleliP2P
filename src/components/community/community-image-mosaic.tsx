import Link from "next/link";
import { CommunityMediaImage } from "@/components/community/community-media-image";

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
  feedInline = false,
  onImageClick,
  className = "",
}: {
  images: MosaicImage[];
  editable?: boolean;
  onRemove?: (id: string) => void;
  onReplace?: (id: string) => void;
  postId?: string;
  feedInline?: boolean;
  onImageClick?: (index: number) => void;
  className?: string;
}) {
  if (!images.length) return null;

  const slot = (img: MosaicImage, index: number, slotClass: string, overlay?: string) => {
    const inner = (
      <>
        <CommunityMediaImage src={img.src} className="h-full w-full" />
        {overlay ? (
          <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/50 text-2xl font-bold text-white">
            {overlay}
          </span>
        ) : null}
        {postId && !editable && !overlay && !feedInline ? (
          <span className="absolute inset-0 bg-black/0 transition hover:bg-black/10" />
        ) : null}
      </>
    );

    const tile = (
      <div className={`relative overflow-hidden ${slotClass}`}>
        {feedInline && onImageClick ? (
          <button
            type="button"
            className="block h-full w-full"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(index);
            }}
          >
            {inner}
          </button>
        ) : postId && !editable && !feedInline ? (
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
        {slot(images[0], 0, "max-h-80 min-h-[160px] w-full")}
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className={`grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl ${className}`}>
        {images.map((img, idx) => slot(img, idx, "min-h-[140px]"))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className={`grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl ${className}`}>
        {slot(images[0], 0, "row-span-2 min-h-[200px]")}
        {slot(images[1], 1, "min-h-[100px]")}
        {slot(images[2], 2, "min-h-[100px]")}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-0.5 overflow-hidden rounded-xl ${className}`}>
      {images.slice(0, 4).map((img, idx) => {
        const isLast = idx === 3 && images.length > 4;
        const overlay = isLast ? `+${images.length - 4}` : undefined;
        return slot(img, idx, "min-h-[120px]", overlay);
      })}
    </div>
  );
}
