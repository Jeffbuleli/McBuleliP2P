"use client";

import { IconCheck } from "@/components/icons/flow-icons";
import { useI18n } from "@/components/i18n-provider";

export type ServiceFeeLine = {
  label: string;
  amount: string;
  asset?: string;
};

export function ServiceFeeConsent({
  lines,
  totalLabel,
  totalAmount,
  totalAsset = "USDT",
  note,
  waived,
  checked,
  onCheckedChange,
  compact,
}: {
  lines: ServiceFeeLine[];
  totalLabel: string;
  totalAmount: string;
  totalAsset?: string;
  note?: string;
  waived?: boolean;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const total = waived ? t("service_fee_waived_test") : `${totalAmount} ${totalAsset}`;

  if (compact) {
    return (
      <label className="fd-card flex cursor-pointer items-start gap-2.5 p-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--fd-border)]"
        />
        <span className="min-w-0 text-[11px] leading-snug text-[color:var(--fd-text)]">
          <span className="font-bold tabular-nums text-[color:var(--fd-primary)]">{total}</span>
          {" · "}
          {t("service_fee_checkbox")}
        </span>
      </label>
    );
  }

  return (
    <div className="fd-card space-y-2 p-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-[color:var(--fd-text)]">{totalLabel}</span>
        <span className="font-bold tabular-nums text-[color:var(--fd-primary)]">{total}</span>
      </div>
      {lines.length > 1 ? (
        <ul className="space-y-0.5 text-[10px] text-[color:var(--fd-muted)]">
          {lines.map((row) => (
            <li key={row.label} className="flex justify-between gap-2">
              <span>{row.label}</span>
              <span className="tabular-nums">
                {row.amount}
                {row.asset ? ` ${row.asset}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : lines[0] ? (
        <p className="text-[10px] text-[color:var(--fd-muted)]">
          {lines[0].label}: {lines[0].amount}
          {lines[0].asset ? ` ${lines[0].asset}` : ""}
        </p>
      ) : null}
      {note ? <p className="text-[10px] text-[color:var(--fd-muted)]">{note}</p> : null}
      <label className="flex cursor-pointer items-start gap-2 border-t border-[color:var(--fd-border)] pt-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded"
        />
        <span className="text-[11px] leading-snug text-[color:var(--fd-text)]">
          {t("service_fee_checkbox")}
        </span>
      </label>
    </div>
  );
}

export function ServiceFeeAuthorizeButton({
  disabled,
  busy,
  onClick,
  label,
}: {
  disabled?: boolean;
  busy?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--fd-primary)] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-50"
    >
      {busy ? null : <IconCheck className="h-4 w-4" />}
      {label}
    </button>
  );
}
