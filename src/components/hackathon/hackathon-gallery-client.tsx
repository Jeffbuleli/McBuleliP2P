"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HACKATHON_GALLERY_PHOTOS,
  HACKATHON_GALLERY_READY,
  type HackathonGalleryPhoto,
} from "@/lib/hackathon/gallery-manifest";
import { HackathonAtmosphere } from "@/components/hackathon/hackathon-atmosphere";
import { HkShell, useHkLocale } from "@/components/hackathon/hk-ui";
import { HackathonPoweredBy } from "@/components/hackathon/hackathon-process-card";

type GalleryFilter = "all" | "batch-a" | "batch-b";

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
  isFr,
}: {
  photo: HackathonGalleryPhoto;
  onOpen: (photo: HackathonGalleryPhoto) => void;
  isFr: boolean;
}) {
  return (
    <article className="mb-3 break-inside-avoid">
      <button
        type="button"
        onClick={() => onOpen(photo)}
        className="group relative block w-full overflow-hidden rounded-2xl bg-[color:var(--hk-soft)] ring-1 ring-[color:var(--hk-border)] transition hover:ring-[color:var(--hk-accent)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--hk-accent)]"
      >
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={photo.thumbUrl}
            alt={photo.fileName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 transition group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 opacity-0 transition group-hover:opacity-100">
          <span className="truncate text-[11px] font-semibold text-white/90">
            {photo.fileName.replace(/\.[^.]+$/, "")}
          </span>
          <span className="shrink-0 rounded-lg bg-white/15 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white ring-1 ring-white/25">
            {isFr ? "HD" : "HD"}
          </span>
        </div>
      </button>
    </article>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-3 sm:p-4"
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
      <div className="relative z-10 flex w-full max-w-6xl flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/10 sm:px-4">
          <p className="min-w-0 truncate text-sm font-semibold text-white">
            {index + 1} / {total}
            <span className="hidden sm:inline"> · {photo.fileName}</span>
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => downloadHd(photo)}
              className="rounded-xl bg-[color:var(--hk-accent)] px-3 py-2 text-xs font-bold text-white shadow-lg shadow-black/20"
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
        <div className="relative mx-auto max-h-[78vh] w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
          <div className="relative aspect-[4/3] w-full max-h-[78vh]">
            <Image
              src={photo.hdUrl}
              alt={photo.fileName}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={index <= 0}
            onClick={onPrev}
            className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 disabled:opacity-35"
          >
            ← {isFr ? "Préc." : "Prev"}
          </button>
          <p className="text-center text-xs text-white/60 sm:hidden">{photo.fileName}</p>
          <button
            type="button"
            disabled={index >= total - 1}
            onClick={onNext}
            className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 disabled:opacity-35"
          >
            {isFr ? "Suiv." : "Next"} →
          </button>
        </div>
      </div>
    </div>
  );
}

export function HackathonGalleryClient() {
  const isFr = useHkLocale();
  const photos = useMemo(() => HACKATHON_GALLERY_PHOTOS, []);
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return photos;
    return photos.filter((p) => p.batch === filter);
  }, [photos, filter]);

  const batchCounts = useMemo(
    () => ({
      all: photos.length,
      "batch-a": photos.filter((p) => p.batch === "batch-a").length,
      "batch-b": photos.filter((p) => p.batch === "batch-b").length,
    }),
    [photos],
  );

  const close = useCallback(() => setActiveIndex(null), []);
  const open = useCallback(
    (photo: HackathonGalleryPhoto) => {
      const idx = filtered.findIndex((p) => p.id === photo.id);
      setActiveIndex(idx >= 0 ? idx : 0);
    },
    [filtered],
  );

  const activePhoto = activeIndex != null ? filtered[activeIndex] : null;

  useEffect(() => {
    if (activeIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") setActiveIndex((i) => Math.max(0, (i ?? 0) - 1));
      if (e.key === "ArrowRight") {
        setActiveIndex((i) => Math.min(filtered.length - 1, (i ?? 0) + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, close, filtered.length]);

  const tabs: { id: GalleryFilter; labelFr: string; labelEn: string }[] = [
    { id: "all", labelFr: "Toutes", labelEn: "All" },
    { id: "batch-a", labelFr: "Bootcamp & build", labelEn: "Bootcamp & build" },
    { id: "batch-b", labelFr: "Hackathon & Demo Day", labelEn: "Hackathon & Demo Day" },
  ];

  return (
    <HkShell authReturnPath="/hackathon/gallery">
      <HackathonAtmosphere variant="page" />
      <main className="relative mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="overflow-hidden rounded-3xl ring-1 ring-[color:var(--hk-border)]">
          <div className="relative h-40 sm:h-52">
            <Image
              src="/hackathon/kinshasa-skyline.jpg"
              alt=""
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--hk-page)] via-black/45 to-black/20" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
                McBuleli Hackathon 2026
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {isFr ? "Galerie photos" : "Photo gallery"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
                {isFr
                  ? "Moments du Silikin Village · cliquez une photo pour l’agrandir · téléchargez chaque cliché en HD."
                  : "Silikin Village moments · click to enlarge · download each shot in HD."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilter(tab.id);
                  setActiveIndex(null);
                }}
                className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                  filter === tab.id
                    ? "bg-[color:var(--hk-accent)] text-white shadow-sm"
                    : "bg-[color:var(--hk-surface)] text-[color:var(--hk-muted)] ring-1 ring-[color:var(--hk-border)] hover:text-[color:var(--hk-text)]"
                }`}
              >
                {isFr ? tab.labelFr : tab.labelEn}
                <span className="ml-1.5 tabular-nums opacity-80">{batchCounts[tab.id]}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/hackathon/espace"
              className="rounded-2xl bg-[color:var(--hk-surface)] px-4 py-2.5 text-sm font-bold text-[color:var(--hk-accent)] ring-1 ring-[color:var(--hk-border)]"
            >
              {isFr ? "Mon espace" : "My hub"}
            </Link>
            <Link
              href="/hackathon"
              className="rounded-2xl bg-[color:var(--hk-accent)] px-4 py-2.5 text-sm font-bold text-white"
            >
              {isFr ? "Landing" : "Landing"}
            </Link>
          </div>
        </div>

        {!HACKATHON_GALLERY_READY ? (
          <p className="mt-8 rounded-2xl bg-[color:var(--hk-surface)] p-6 text-sm text-[color:var(--hk-muted)] ring-1 ring-[color:var(--hk-border)]">
            {isFr
              ? "La galerie est en cours de préparation. Revenez dans quelques minutes."
              : "The gallery is being prepared. Check back in a few minutes."}
          </p>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[color:var(--hk-surface)] p-4 ring-1 ring-[color:var(--hk-border)] sm:col-span-2">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--hk-accent)]">
                  {isFr ? "Téléchargement HD" : "HD download"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--hk-muted)]">
                  {isFr
                    ? "Chaque photo est hébergée en pleine résolution. Ouvrez-la, puis utilisez « Télécharger HD » - idéal pour LinkedIn, portfolio ou souvenirs d’équipe."
                    : "Each photo is hosted in full resolution. Open it, then use “Download HD” - perfect for LinkedIn, portfolios or team memories."}
                </p>
              </div>
              <div className="rounded-2xl bg-[color:var(--hk-soft)] p-4 text-center ring-1 ring-[color:var(--hk-border)]">
                <p className="text-3xl font-black tabular-nums text-[color:var(--hk-accent)]">
                  {filtered.length}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
                  {isFr ? "photos affichées" : "photos shown"}
                </p>
              </div>
            </div>

            <div className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4">
              {filtered.map((photo) => (
                <GalleryTile key={photo.id} photo={photo} onOpen={open} isFr={isFr} />
              ))}
            </div>
          </>
        )}

        <p className="mt-10 text-center text-xs text-[color:var(--hk-muted)]">
          <Link
            href="/hackathon"
            className="font-semibold text-[color:var(--hk-accent)] hover:underline"
          >
            ← Hackathon
          </Link>
        </p>
        <HackathonPoweredBy />
      </main>

      {activePhoto && activeIndex != null ? (
        <Lightbox
          photo={activePhoto}
          index={activeIndex}
          total={filtered.length}
          onClose={close}
          onPrev={() => setActiveIndex((i) => Math.max(0, (i ?? 0) - 1))}
          onNext={() => setActiveIndex((i) => Math.min(filtered.length - 1, (i ?? 0) + 1))}
          isFr={isFr}
        />
      ) : null}
    </HkShell>
  );
}
