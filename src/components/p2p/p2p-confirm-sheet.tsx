"use client";

import type { ReactNode } from "react";

export type P2pSheetVariant = "buy" | "sell" | "warn" | "danger" | "info";

const VARIANT_BTN: Record<P2pSheetVariant, string> = {
  buy: "p2p-sheet-btn--buy",
  sell: "p2p-sheet-btn--sell",
  warn: "p2p-sheet-btn--warn",
  danger: "p2p-sheet-btn--danger",
  info: "p2p-sheet-btn--buy",
};

export type P2pChecklistItem = {
  id: string;
  label: string;
};

export function P2pChecklist({
  items,
  checked,
  onToggle,
}: {
  items: P2pChecklistItem[];
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const on = !!checked[item.id];
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              className={`p2p-checklist-item ${on ? "p2p-checklist-item--on" : ""}`}
            >
              <span className="p2p-checklist-box" aria-hidden>
                {on ? (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                    <path
                      d="M3 8l3.5 3.5L13 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </span>
              <span className="text-left text-[11px] font-semibold leading-snug text-[color:var(--fd-text)]">
                {item.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function P2pConfirmSheet({
  open,
  variant,
  illustration,
  title,
  subtitle,
  checklist,
  checked,
  onToggle,
  confirmLabel,
  cancelLabel,
  busy,
  confirmDisabled,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  variant: P2pSheetVariant;
  illustration?: ReactNode;
  title: string;
  subtitle?: string;
  checklist?: P2pChecklistItem[];
  checked?: Record<string, boolean>;
  onToggle?: (id: string) => void;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  if (!open) return null;

  const allChecked =
    !checklist?.length ||
    checklist.every((c) => checked?.[c.id]);

  return (
    <div className="p2p-sheet-overlay" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`p2p-sheet p2p-sheet--${variant}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p2p-sheet__hero">
          {illustration ? (
            <div className="p2p-sheet__illus">{illustration}</div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[color:var(--fd-text)]">{title}</h3>
            {subtitle ? (
              <p className="mt-1 text-[11px] leading-snug text-[color:var(--fd-muted)]">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {children ? <div className="mt-3">{children}</div> : null}

        {checklist?.length && checked && onToggle ? (
          <div className="mt-4">
            <P2pChecklist items={checklist} checked={checked} onToggle={onToggle} />
          </div>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button type="button" className="p2p-sheet-btn p2p-sheet-btn--ghost flex-1" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy || confirmDisabled || !allChecked}
            onClick={onConfirm}
            className={`p2p-sheet-btn flex-1 ${VARIANT_BTN[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
