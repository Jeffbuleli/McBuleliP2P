"use client";

import { useEffect, useRef, useState } from "react";
import { IconPhoto, IconTrash } from "@/components/icons";
import { COMPOSE_MAX_PHOTOS } from "@/lib/compose/limits";

type Props = {
  photos: File[];
  onChange: (files: File[]) => void;
  label: string;
  discrete?: boolean;
};

export function ComposePhotos({
  photos,
  onChange,
  label,
  discrete = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [photos]);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...photos];
    for (const f of Array.from(list)) {
      if (!f.type.startsWith("image/")) continue;
      if (next.length >= COMPOSE_MAX_PHOTOS) break;
      next.push(f);
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={photos.length >= COMPOSE_MAX_PHOTOS}
          onClick={() => inputRef.current?.click()}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold disabled:opacity-40 ${
            discrete
              ? "bg-white/10 text-[#e8d4e3]"
              : "bg-ng-primary-muted text-ng-primary"
          }`}
          aria-label={label}
        >
          <IconPhoto className="size-4" />
          <span className="tabular-nums">
            {photos.length}/{COMPOSE_MAX_PHOTOS}
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>
      {previews.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {previews.map((url, i) => (
            <li
              key={url}
              className="relative size-16 overflow-hidden rounded-xl border border-[var(--ng-border)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-0.5 top-0.5 inline-flex size-6 items-center justify-center rounded-full bg-black/55 text-white"
                aria-label="Delete"
              >
                <IconTrash className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
