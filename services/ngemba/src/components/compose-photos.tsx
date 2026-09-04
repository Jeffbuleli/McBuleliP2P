"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconClose,
  IconPhoto,
  IconTrash,
} from "@/components/icons";
import { COMPOSE_MAX_PHOTOS } from "@/lib/compose/limits";

type Props = {
  photos: File[];
  onChange: (files: File[]) => void;
  label: string;
  discrete?: boolean;
};

function mosaicClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-2";
  return "grid-cols-2";
}

function IconReplace({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M4 12a8 8 0 0 1 13.5-5.8M20 12a8 8 0 0 1-13.5 5.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M17 3.5v4h4M7 20.5v-4H3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ComposePhotos({
  photos,
  onChange,
  label,
  discrete = false,
}: Props) {
  const addRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const replaceIndexRef = useRef<number | null>(null);

  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    const next = photos.map((f) => URL.createObjectURL(f));
    const prev = urlsRef.current;
    urlsRef.current = next;
    setPreviews(next);
    // Revoke previous after paint so imgs never point at a dead blob.
    const t = window.setTimeout(() => {
      prev.forEach((u) => URL.revokeObjectURL(u));
    }, 0);
    return () => {
      window.clearTimeout(t);
    };
  }, [photos]);

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsRef.current = [];
    };
  }, []);

  function isImageFile(f: File): boolean {
    if (f.type.startsWith("image/")) return true;
    return /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(f.name);
  }

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...photos];
    for (const f of Array.from(list)) {
      if (!isImageFile(f)) continue;
      if (next.length >= COMPOSE_MAX_PHOTOS) break;
      next.push(f);
    }
    onChange(next);
    if (addRef.current) addRef.current.value = "";
  }

  function replaceFile(list: FileList | null) {
    const idx = replaceIndexRef.current;
    replaceIndexRef.current = null;
    if (idx == null || !list?.[0] || !isImageFile(list[0])) return;
    const next = [...photos];
    next[idx] = list[0];
    onChange(next);
    if (replaceRef.current) replaceRef.current.value = "";
    setActive(idx);
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
    setActive(null);
  }

  function startReplace(index: number) {
    replaceIndexRef.current = index;
    replaceRef.current?.click();
  }

  const tileH =
    photos.length <= 1
      ? "min-h-[11rem] sm:min-h-[13rem]"
      : "min-h-[8rem] sm:min-h-[9.5rem]";

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={addRef}
        type="file"
        accept="image/*,image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/*,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => replaceFile(e.target.files)}
      />

      <div
        className={`relative min-h-[11rem] rounded-2xl border border-dashed p-2 sm:min-h-[12.5rem] ${
          discrete
            ? "border-white/20 bg-white/[0.03]"
            : "border-[var(--ng-border)] bg-ng-surface/60"
        }`}
      >
        {photos.length === 0 ? (
          <button
            type="button"
            onClick={() => addRef.current?.click()}
            className={`flex h-full min-h-[10rem] w-full flex-col items-center justify-center gap-2 rounded-xl ${
              discrete ? "text-[#c9a0bc]" : "text-ng-muted"
            }`}
            aria-label={label}
            title={label}
          >
            <IconPhoto className="size-8 opacity-70" />
            <span className="tabular-nums text-xs font-semibold">
              0/{COMPOSE_MAX_PHOTOS}
            </span>
          </button>
        ) : (
          <ul className={`grid gap-2 ${mosaicClass(photos.length)}`}>
            {previews.map((url, i) => (
              <li
                key={`${photos[i]?.name ?? "p"}-${i}-${photos[i]?.size ?? 0}`}
                className={`relative overflow-hidden rounded-xl border border-[var(--ng-border)] bg-black/5 ${tileH} ${
                  photos.length === 3 && i === 0 ? "row-span-2 min-h-[16.5rem]" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className="block size-full"
                  aria-label="View"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    decoding="async"
                    className="size-full min-h-[inherit] object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = "0.35";
                    }}
                  />
                </button>
              </li>
            ))}
            {photos.length < COMPOSE_MAX_PHOTOS ? (
              <li>
                <button
                  type="button"
                  onClick={() => addRef.current?.click()}
                  className={`flex ${tileH} w-full items-center justify-center rounded-xl border border-dashed ${
                    discrete
                      ? "border-white/20 text-[#c9a0bc]"
                      : "border-[var(--ng-border)] text-ng-muted"
                  }`}
                  aria-label={label}
                  title={label}
                >
                  <IconPhoto className="size-6" />
                  <span className="ml-1.5 tabular-nums text-xs font-semibold">
                    {photos.length}/{COMPOSE_MAX_PHOTOS}
                  </span>
                </button>
              </li>
            ) : null}
          </ul>
        )}
      </div>

      {active != null && previews[active] ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center"
          role="dialog"
          aria-modal
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-ng-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previews[active]}
              alt=""
              className="max-h-[55vh] w-full object-contain bg-black/5"
            />
            <div className="flex items-center justify-around gap-2 p-3">
              <button
                type="button"
                onClick={() => setActive(null)}
                className="inline-flex size-12 items-center justify-center rounded-xl bg-ng-primary-muted text-ng-primary"
                aria-label="Close"
                title="Close"
              >
                <IconClose className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => startReplace(active)}
                className="inline-flex size-12 items-center justify-center rounded-xl bg-ng-primary-muted text-ng-primary"
                aria-label="Replace"
                title="Replace"
              >
                <IconReplace className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => removeAt(active)}
                className="inline-flex size-12 items-center justify-center rounded-xl bg-ng-urgent/10 text-ng-urgent"
                aria-label="Delete"
                title="Delete"
              >
                <IconTrash className="size-5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
