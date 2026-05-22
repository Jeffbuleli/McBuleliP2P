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
}: {
  lines: ServiceFeeLine[];
  totalLabel: string;
  totalAmount: string;
  totalAsset?: string;
  note?: string;
  waived?: boolean;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="fd-card space-y-3 p-4">
      <h3 className="text-sm font-bold text-[color:var(--fd-text)]">{t("service_fee_title")}</h3>
      <div className="divide-y divide-[color:var(--fd-border)] rounded-xl border border-[color:var(--fd-border)]">
        {lines.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
          >
            <span className="text-[color:var(--fd-muted)]">{row.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-[color:var(--fd-text)]">
              {row.amount}
              {row.asset ? ` ${row.asset}` : ""}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 bg-stone-50/80 px-3 py-2.5 text-sm">
          <span className="font-semibold text-[color:var(--fd-text)]">{totalLabel}</span>
          <span className="shrink-0 font-bold tabular-nums text-[color:var(--fd-primary)]">
            {waived ? t("service_fee_waived_test") : `${totalAmount} ${totalAsset}`}
          </span>
        </div>
      </div>
      {note ? <p className="text-[10px] leading-snug text-[color:var(--fd-muted)]">{note}</p> : null}
      {waived ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">
          {t("service_fee_waived_test")}
        </p>
      ) : null}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[color:var(--fd-border)] p-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-[color:var(--fd-border)] text-[color:var(--fd-primary)]"
        />
        <span className="text-xs leading-snug text-[color:var(--fd-text)]">
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
