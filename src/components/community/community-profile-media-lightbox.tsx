"use client";

import { useEffect } from "react";

/** Fullscreen photo viewer for profile avatar / cover. */
export function CommunityProfileMediaLightbox({
  open,
  src,
  label,
  fr,
  onClose,
}: {
  open: boolean;
  src: string | null;
  label: string;
  fr: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex flex-col bg-black/95"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label={label}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="truncate text-sm font-semibold">{label}</span>
        <button
          type="button"
          className="text-2xl leading-none"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label={fr ? "Fermer" : "Close"}
        >
          ×
        </button>
      </div>
      <div
        className="flex flex-1 items-center justify-center p-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="max-h-[85vh] max-w-full object-contain"
        />
      </div>
    </div>
  );
}
