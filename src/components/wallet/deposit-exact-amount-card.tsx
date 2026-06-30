"use client";

import { useState } from "react";
import { IconCopy } from "@/components/icons/flow-icons";
import { IllustrationExactAmount } from "@/components/wallet/deposit-illustrations";
import { FlowCard } from "@/components/wallet/wallet-flow-shell";
import { formatDepositPayAmount } from "@/lib/format-deposit-pay-amount";
import { useI18n } from "@/components/i18n-provider";

type Props = {
  expectedAmount: string;
  asset: string;
  countdownSec?: number;
  onCopied?: () => void;
};

export function DepositExactAmountCard({
  expectedAmount,
  asset,
  countdownSec = 0,
  onCopied,
}: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const payable = formatDepositPayAmount(expectedAmount);
  const line = `${payable} ${asset}`;

  async function copyAmount() {
    await navigator.clipboard.writeText(payable);
    setCopied(true);
    onCopied?.();
    window.setTimeout(() => setCopied(false), 2000);
  }

  const min = Math.floor(countdownSec / 60);
  const sec = countdownSec % 60;
  const timer =
    countdownSec > 0
      ? `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : null;

  return (
    <FlowCard className="mt-3 border-indigo-200/80 bg-gradient-to-b from-indigo-50/90 to-white">
      <div className="flex items-start gap-3">
        <IllustrationExactAmount className="h-14 w-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">
            {t("deposit_exact_amount_title")}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums leading-tight text-[color:var(--fd-text)]">
            {payable}
            <span className="ml-1.5 text-base font-semibold text-indigo-800">{asset}</span>
          </p>
          {timer ? (
            <p className="mt-1 text-[11px] font-semibold text-[color:var(--fd-muted)]">
              {t("deposit_timer_short")} {timer}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void copyAmount()}
        className="mt-4 flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl bg-indigo-600 text-base font-bold text-white shadow-sm active:scale-[0.98]"
      >
        <IconCopy className="h-5 w-5" />
        {copied ? t("copy_done") : t("deposit_copy_amount")}
      </button>

      <p className="sr-only">{line}</p>
    </FlowCard>
  );
}
