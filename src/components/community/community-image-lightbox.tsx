"use client";

import { useCallback, useEffect, useState } from "react";

export function CommunityImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
  fr,
  downloadHrefFor,
}: {
  images: { id: string; src: string }[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  fr: boolean;
  /** Optional HD download URL builder (e.g. authenticated proxy). */
  downloadHrefFor?: (src: string) => string;
}) {
  const current = images[index];
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;
  const [downloading, setDownloading] = useState(false);

  const goPrev = useCallback(() => {
    if (hasPrev) onIndexChange(index - 1);
  }, [hasPrev, index, onIndexChange]);

  const goNext = useCallback(() => {
    if (hasNext) onIndexChange(index + 1);
  }, [hasNext, index, onIndexChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goPrev, goNext]);

  async function downloadHd() {
    if (!current) return;
    setDownloading(true);
    try {
      const href = downloadHrefFor?.(current.src) ?? current.src;
      const res = await fetch(href, { cache: "no-store" });
      if (!res.ok) {
        window.open(current.src, "_blank", "noopener,noreferrer");
        return;
      }
      const blob = await res.blob();
      const path = (() => {
        try {
          return new URL(current.src).pathname.split("/").pop() || "image.jpg";
        } catch {
          return "image.jpg";
        }
      })();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = path.includes(".") ? path : `${path}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(current.src, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  }

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex flex-col bg-black/95"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label={fr ? "Galerie photos" : "Photo gallery"}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <span className="text-sm font-semibold tabular-nums">
          {index + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={downloading}
            onClick={(e) => {
              e.stopPropagation();
              void downloadHd();
            }}
            className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold tracking-wide hover:bg-white/25 disabled:opacity-60"
          >
            {downloading
              ? fr
                ? "…"
                : "…"
              : fr
                ? "Télécharger HD"
                : "Download HD"}
          </button>
          <button
            type="button"
            className="text-2xl leading-none"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label={fr ? "Fermer" : "Close"}
          >
            ✕
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center px-2"
        onClick={(e) => e.stopPropagation()}
      >
        {hasPrev ? (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-xl text-white"
            aria-label={fr ? "Photo précédente" : "Previous photo"}
          >
            ‹
          </button>
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt=""
          className="max-h-[calc(100vh-8rem)] max-w-full object-contain"
        />

        {hasNext ? (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-xl text-white"
            aria-label={fr ? "Photo suivante" : "Next photo"}
          >
            ›
          </button>
        ) : null}
      </div>
    </div>
  );
}
