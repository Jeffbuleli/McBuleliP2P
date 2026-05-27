"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";

function useSheetLock(open: boolean, onClose: () => void) {
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
}

export function AvecGovConfirmSheet({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  busy,
  variant = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  useSheetLock(open, onCancel);
  if (!open) return null;

  const confirmCls =
    variant === "danger"
      ? "bg-rose-600 text-white"
      : "bg-[color:var(--fd-primary)] text-white";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-bold text-[color:var(--fd-text)]">{title}</p>
        {message ? (
          <p className="mt-2 text-xs leading-relaxed text-[color:var(--fd-muted)]">{message}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-xl border border-[color:var(--fd-border)] px-4 py-2 text-xs font-bold disabled:opacity-50"
          >
            {cancelLabel ?? t("group_gov_sheet_cancel")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-50 ${confirmCls}`}
          >
            {confirmLabel ?? t("group_gov_sheet_confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AvecGovPromptSheet({
  open,
  title,
  message,
  placeholder,
  minLength = 10,
  confirmLabel,
  cancelLabel,
  busy,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  minLength?: number;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  useSheetLock(open, onCancel);

  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  if (!open) return null;

  const valid = value.trim().length >= minLength;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-bold text-[color:var(--fd-text)]">{title}</p>
        {message ? (
          <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{message}</p>
        ) : null}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder ?? t("group_gov_sheet_prompt_placeholder")}
          rows={4}
          className="mt-3 w-full resize-none rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] px-3 py-2 text-xs"
        />
        <p className="mt-1 text-[9px] text-[color:var(--fd-muted)]">
          {t("group_gov_sheet_min_chars", { n: String(minLength) })}
        </p>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-xl border border-[color:var(--fd-border)] px-4 py-2 text-xs font-bold disabled:opacity-50"
          >
            {cancelLabel ?? t("group_gov_sheet_cancel")}
          </button>
          <button
            type="button"
            disabled={busy || !valid}
            onClick={() => onSubmit(value.trim())}
            className="rounded-xl bg-[color:var(--fd-primary)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {confirmLabel ?? t("group_gov_sheet_submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
