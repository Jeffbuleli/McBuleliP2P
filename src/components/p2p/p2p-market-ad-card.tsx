"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import type { Locale } from "@/i18n/locale";
import { countryLabel } from "@/lib/country-label";
import { P2pIconEscrow, P2pIconStar } from "@/components/p2p/p2p-icons";
export type P2pMarketAd = {
  id: string;
  side: string;
  asset: string;
  fiatCurrency: string;
  price: string;
  minFiat: string;
  maxFiat: string;
  paymentMethods: string;
  terms: string | null;
  countryCode: string | null;
  makerName: string;
  makerRating: { avg: number; count: number } | null;
};

const ASSET_ICON: Record<string, string> = {
  USDT: "/assets/crypto/usdt.png",
  PI: "/assets/crypto/pi.png",
};

export function P2pMarketAdCard({
  ad,
  locale,
  fmt,
}: {
  ad: P2pMarketAd;
  locale: Locale;
  fmt: (n: string, cur: string) => string;
}) {
  const { t } = useI18n();
  const isSellAd = ad.side === "sell";
  const icon = ASSET_ICON[ad.asset];
  const roleLabel = isSellAd ? t("p2p_role_you_buy") : t("p2p_role_you_sell");

  return (
    <li className="fd-card overflow-hidden p-0">
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 px-3 py-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--fd-mint-deep)] px-2 py-0.5 text-[10px] font-bold uppercase text-[color:var(--fd-primary)] ring-1 ring-[color:var(--fd-border)]">
          <P2pIconEscrow className="h-3 w-3" />
          {t("p2p_market_escrow_badge")}
        </span>
        {ad.countryCode ? (
          <span className="text-[10px] font-semibold text-[color:var(--fd-muted)]">
            {countryLabel(locale, ad.countryCode)}
          </span>
        ) : null}
      </div>

      <div className="p-3">
        <div className="flex items-center gap-3">
          {icon ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)]">
              <Image src={icon} alt="" width={36} height={36} className="rounded-full" />
            </span>
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-xs font-bold text-[color:var(--fd-primary)]">
              {ad.asset.slice(0, 2)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[color:var(--fd-muted)]">
              {isSellAd ? t("p2p_side_sell") : t("p2p_side_buy")} · {ad.asset}/{ad.fiatCurrency}
            </p>
            <p className="text-xl font-bold tabular-nums text-[color:var(--fd-text)]">
              {fmt(ad.price, ad.fiatCurrency)}
              <span className="text-sm font-semibold text-[color:var(--fd-muted)]"> / {ad.asset}</span>
            </p>
            <p className="text-[10px] text-[color:var(--fd-muted)]">
              {fmt(ad.minFiat, ad.fiatCurrency)} — {fmt(ad.maxFiat, ad.fiatCurrency)}
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
          <span className="rounded-full bg-[color:var(--fd-mint)] px-2 py-0.5 font-bold text-[color:var(--fd-primary)]">
            {roleLabel}
          </span>
          <span className="truncate font-medium text-[color:var(--fd-text)]">{ad.makerName}</span>
          {ad.makerRating && ad.makerRating.count > 0 ? (
            <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600">
              <P2pIconStar filled className="h-3 w-3" />
              {ad.makerRating.avg.toFixed(1)}
            </span>
          ) : null}
        </div>

        <p className="mt-1.5 line-clamp-1 text-[10px] text-[color:var(--fd-muted)]">
          {ad.paymentMethods}
        </p>

        <Link
          href={`/app/p2p/ad/${ad.id}/trade`}
          className="fd-btn-soft mt-3 flex min-h-[48px] items-center justify-center rounded-2xl text-sm font-bold active:scale-[0.99]"
        >
          {isSellAd ? t("p2p_cta_buy") : t("p2p_cta_sell")}
        </Link>
      </div>
    </li>
  );
}
