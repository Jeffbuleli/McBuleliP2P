"use client";

import type { ReactNode } from "react";

export function P2pConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger,
  busy,
  onConfirm,
  onClose,
  extra,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  extra?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-stone-900"
      >
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">{title}</h3>
        <div className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{body}</div>
        {extra ? <div className="mt-4">{extra}</div> : null}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-xl border border-stone-300 py-3 text-sm font-semibold dark:border-stone-600"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50 ${
              danger ? "bg-rose-600" : "bg-emerald-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
