"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "@/components/icons/flow-icons";

export function ProfileActionSheet({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-[1px]"
        aria-label={title}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-sheet-title"
        className="relative mx-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-[var(--fd-border)] bg-[color:var(--fd-card)] shadow-[0_-12px_48px_rgba(14,122,75,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-[var(--fd-border)] bg-[color:var(--fd-card)] px-4 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="profile-sheet-title" className="text-base font-bold text-[#1c1917]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--fd-muted)]">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--fd-border)] bg-white text-[var(--fd-muted)]"
            aria-label="Close"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
