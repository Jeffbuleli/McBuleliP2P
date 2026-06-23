"use client";

import { useI18n } from "@/components/i18n-provider";

function formatPresetAmount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  const rounded = Math.floor(n * 1e6) / 1e6;
  return String(rounded);
}

export function WalletAmountPresets({
  availableMax,
  onPick,
  disabled,
}: {
  availableMax: number;
  onPick: (amount: string) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();

  if (!Number.isFinite(availableMax) || availableMax <= 0) return null;

  const presets = [
    { label: "25%", value: availableMax * 0.25 },
    { label: "50%", value: availableMax * 0.5 },
    { label: "75%", value: availableMax * 0.75 },
    { label: t("wallet_amount_preset_max"), value: availableMax },
  ];

  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
      <span className="text-[11px] font-semibold text-[color:var(--fd-muted)]">
        {t("wallet_amount_presets")}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            disabled={disabled || p.value <= 0}
            onClick={() => onPick(formatPresetAmount(p.value))}
            className="rounded-full border border-[color:var(--fd-border)] bg-white px-2.5 py-1 text-[11px] font-bold text-[color:var(--fd-text)] shadow-sm active:scale-95 disabled:opacity-45"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
