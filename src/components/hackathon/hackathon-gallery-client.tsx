"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  HACKATHON_GALLERY_PHOTOS,
  HACKATHON_GALLERY_READY,
  type HackathonGalleryPhoto,
} from "@/lib/hackathon/gallery-manifest";
import { HackathonAtmosphere } from "@/components/hackathon/hackathon-atmosphere";
import { HkPage, HkShell, useHkLocale } from "@/components/hackathon/hk-ui";

function downloadHd(photo: HackathonGalleryPhoto): void {
  const a = document.createElement("a");
  a.href = photo.hdUrl;
  a.download = photo.fileName || `${photo.id}.jpg`;
  a.rel = "noopener";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function GalleryTile({
  photo,
  onOpen,
}: {
  photo: HackathonGalleryPhoto;
  onOpen: (photo: HackathonGalleryPhoto) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(photo)}
      className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[color:var(--hk-soft)] ring-1 ring-[color:var(--hk-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hk-accent)]"
    >
      <Image
        src={photo.thumbUrl}
        alt={photo.fileName}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition duration-300 group-hover:scale-[1.03]"
      />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-left text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
        HD
      </span>
    </button>
  );
}

function Lightbox({
  photo,
  index,
  total,
  onClose,
  onPrev,
  onNext,
  isFr,
}: {
  photo: HackathonGalleryPhoto;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  isFr: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isFr ? "Photo agrandie" : "Enlarged photo"}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={isFr ? "Fermer" : "Close"}
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full max-w-5xl flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-white">
          <p className="truncate text-sm font-semibold">
            {index + 1} / {total} · {photo.fileName}
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => downloadHd(photo)}
              className="rounded-xl bg-[color:var(--hk-accent)] px-3 py-2 text-xs font-bold text-white"
            >
              {isFr ? "Télécharger HD" : "Download HD"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white ring-1 ring-white/20"
            >
              {isFr ? "Fermer" : "Close"}
            </button>
          </div>
        </div>
        <div className="relative mx-auto aspect-[4/3] w-full max-h-[75vh] overflow-hidden rounded-2xl bg-black">
          <Image
            src={photo.hdUrl}
            alt={photo.fileName}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            disabled={index <= 0}
            onClick={onPrev}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 disabled:opacity-40"
          >
            ←
          </button>
          <button
            type="button"
            disabled={index >= total - 1}
            onClick={onNext}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

export function HackathonGalleryClient() {
  const isFr = useHkLocale();
  const photos = useMemo(() => HACKATHON_GALLERY_PHOTOS, []);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const open = useCallback((photo: HackathonGalleryPhoto) => {
    const idx = photos.findIndex((p) => p.id === photo.id);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [photos]);

  const activePhoto = activeIndex != null ? photos[activeIndex] : null;

  return (
    <HkShell authReturnPath="/hackathon/gallery">
      <HackathonAtmosphere variant="page" />
      <HkPage
        eyebrow={isFr ? "Hackathon 2026" : "Hackathon 2026"}
        title={isFr ? "Galerie photos" : "Photo gallery"}
        lede={
          isFr
            ? "Moments du bootcamp et du hackathon au Silikin Village. Cliquez une photo pour l’agrandir ou la télécharger en HD."
            : "Bootcamp and hackathon moments at Silikin Village. Click a photo to enlarge or download in HD."
        }
        actions={
          <Link
            href="/hackathon"
            className="rounded-2xl bg-[color:var(--hk-surface)] px-4 py-3 text-sm font-bold text-[color:var(--hk-accent)] ring-1 ring-[color:var(--hk-border)]"
          >
            {isFr ? "Landing" : "Landing"}
          </Link>
        }
      >
        {!HACKATHON_GALLERY_READY ? (
          <p className="rounded-2xl bg-[color:var(--hk-surface)] p-6 text-sm text-[color:var(--hk-muted)] ring-1 ring-[color:var(--hk-border)]">
            {isFr
              ? "La galerie est en cours de préparation. Revenez dans quelques minutes."
              : "The gallery is being prepared. Check back in a few minutes."}
          </p>
        ) : (
          <>
            <p className="text-sm font-semibold text-[color:var(--hk-muted)]">
              {photos.length} {isFr ? "photos" : "photos"}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <GalleryTile key={photo.id} photo={photo} onOpen={open} />
              ))}
            </div>
          </>
        )}
      </HkPage>

      {activePhoto && activeIndex != null ? (
        <Lightbox
          photo={activePhoto}
          index={activeIndex}
          total={photos.length}
          onClose={close}
          onPrev={() => setActiveIndex((i) => Math.max(0, (i ?? 0) - 1))}
          onNext={() => setActiveIndex((i) => Math.min(photos.length - 1, (i ?? 0) + 1))}
          isFr={isFr}
        />
      ) : null}
    </HkShell>
  );
}
