"use client";

import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/i18n/messages";
import { P2pIconEscrow } from "@/components/p2p/p2p-icons";

/** Compact escrow + amounts (icon-first, minimal text). */
export function P2pOrderSummary({
  fiatAmount,
  fiatCurrency,
  cryptoAmount,
  asset,
  locale,
}: {
  fiatAmount: string;
  fiatCurrency: string;
  cryptoAmount: string;
  asset: string;
  locale: string;
}) {
  const { t } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const fiat = Number(fiatAmount);

  return (
    <div className="fd-card flex items-center gap-3 p-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--fd-primary)] text-white">
        <P2pIconEscrow className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("p2p_escrow_card_title")}
        </p>
        <p className="text-lg font-bold tabular-nums text-[color:var(--fd-text)]">
          {Number.isFinite(fiat) ? fiat.toLocaleString(loc) : fiatAmount} {fiatCurrency}
          <span className="text-sm font-semibold text-[color:var(--fd-muted)]">
            {" "}
            → {cryptoAmount} {asset}
          </span>
        </p>
        <p className="text-[10px] text-[color:var(--fd-muted)]">
          {interpolate(t("p2p_escrow_locked_amount"), { amount: cryptoAmount, asset })}
        </p>
      </div>
    </div>
  );
}
