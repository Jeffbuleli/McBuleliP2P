"use client";

import { useEffect, type ReactNode } from "react";
import {
  IconLink,
  IconRepost,
  IconShare,
} from "@/components/community/community-icons";

export function CommunityShareSheet({
  open,
  onClose,
  fr,
  repostedByMe,
  busy,
  onRepost,
  onCopyLink,
  onExternalShare,
}: {
  open: boolean;
  onClose: () => void;
  fr: boolean;
  repostedByMe?: boolean;
  busy?: boolean;
  onRepost: () => void;
  onCopyLink: () => void;
  onExternalShare: () => void;
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

  if (!open) return null;

  const Item = ({
    icon,
    label,
    hint,
    onClick,
    accent,
  }: {
    icon: ReactNode;
    label: string;
    hint: string;
    onClick: () => void;
    accent?: boolean;
  }) => (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition active:scale-[0.99] disabled:opacity-50 ${
        accent ? "bg-[#eaf5ee] text-[#305f33]" : "hover:bg-[#f7fbf8]"
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#305f33] shadow-sm ring-1 ring-[#e8f3ee]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[#0c0a09]">{label}</span>
        <span className="block text-[11px] text-[#78716c]">{hint}</span>
      </span>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-sheet-title"
        className="w-full max-w-md overflow-hidden rounded-t-[1.75rem] border border-[#e8f3ee] bg-white shadow-xl sm:rounded-[1.75rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#e8f3ee] px-4 pb-2 pt-3">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#d6d3d1] sm:hidden" />
          <div className="flex items-center justify-between gap-2">
            <h2
              id="share-sheet-title"
              className="text-base font-extrabold text-[#0c0a09]"
            >
              {fr ? "Partager" : "Share"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8f3ee] text-[#78716c]"
              aria-label={fr ? "Fermer" : "Close"}
            >
              ×
            </button>
          </div>
          <p className="text-[11px] text-[#78716c]">
            {fr
              ? "Republier dans McBuleli, ou partager ailleurs."
              : "Repost inside McBuleli, or share elsewhere."}
          </p>
        </div>

        <div className="space-y-1 px-2 py-2">
          <Item
            icon={<IconRepost size={18} filled={repostedByMe} />}
            label={
              repostedByMe
                ? fr
                  ? "Annuler la republication"
                  : "Undo repost"
                : fr
                  ? "Republier"
                  : "Repost"
            }
            hint={
              repostedByMe
                ? fr
                  ? "Retirer de ton fil"
                  : "Remove from your feed"
                : fr
                  ? "Sur ton fil communauté"
                  : "On your community feed"
            }
            onClick={onRepost}
            accent={!repostedByMe}
          />
          <Item
            icon={<IconLink size={18} />}
            label={fr ? "Copier le lien" : "Copy link"}
            hint={fr ? "Partage rapide" : "Quick share"}
            onClick={onCopyLink}
          />
          <Item
            icon={<IconShare size={18} />}
            label={fr ? "Externe" : "External"}
            hint={fr ? "Apps, messages…" : "Apps, messages…"}
            onClick={onExternalShare}
          />
        </div>
      </div>
    </div>
  );
}
