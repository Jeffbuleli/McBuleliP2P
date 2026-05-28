"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { TransactionStepper } from "@/components/wallet/transaction-progress";
import type { TxStep } from "@/lib/transaction-steps";

export function ProcessingSheet({
  open,
  title,
  subtitle,
  steps,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  steps: TxStep[];
  onClose?: () => void;
}) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        aria-label={title}
        onClick={onClose}
      />
      <div
        className="notif-drawer-panel relative mx-auto w-full max-w-lg rounded-t-3xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-5 shadow-[0_-12px_48px_rgba(28,25,23,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-300" />
        <p className="text-center text-lg font-bold text-[color:var(--fd-text)]">{title}</p>
        <p className="mt-1 text-center text-xs text-[color:var(--fd-muted)]">
          {subtitle ?? t("status_ui_processing")}
        </p>
        <div className="mt-4">
          <TransactionStepper steps={steps} compact />
        </div>
      </div>
    </div>,
    document.body,
  );
}
