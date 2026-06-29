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
    <FlowCard className="mt-3 border-cyan-400/30 bg-cyan-500/8">
      <div className="flex items-start gap-3">
        <IllustrationExactAmount className="h-14 w-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-400/80">
            {t("deposit_exact_amount_title")}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums leading-tight text-[color:var(--fd-text)]">
            {payable}
            <span className="ml-1.5 text-base font-semibold text-cyan-300">{asset}</span>
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
        className="mt-4 flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl border border-cyan-400/45 bg-cyan-500/18 text-base font-bold text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.1)] active:scale-[0.98]"
      >
        <IconCopy className="h-5 w-5" />
        {copied ? t("copy_done") : t("deposit_copy_amount")}
      </button>

      <p className="sr-only">{line}</p>
    </FlowCard>
  );
}
