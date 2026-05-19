"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import type { Locale } from "@/i18n/locale";
import { countryLabel } from "@/lib/country-label";
import { P2pIconBuy, P2pIconEscrow, P2pIconSell, P2pIconStar } from "@/components/p2p/p2p-icons";
import type { P2pSide } from "@/lib/p2p-config";
import { p2pFlowHint, p2pTakerFlowHintKey } from "@/lib/p2p-ui";

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
  const roleHint = p2pFlowHint(
    t,
    p2pTakerFlowHintKey(ad.side as P2pSide, ad.fiatCurrency),
    ad.fiatCurrency,
  );

  return (
    <li className="overflow-hidden rounded-2xl border border-stone-700 bg-stone-900 shadow-sm">
      <div
        className={`flex items-center justify-between gap-2 border-b px-3 py-2 ${
          isSellAd ? "border-rose-900/30 bg-rose-950/35" : "border-emerald-900/30 bg-emerald-950/40"
        }`}
      >
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white ${
            isSellAd ? "bg-rose-600" : "bg-emerald-700"
          }`}
        >
          <P2pIconEscrow className="h-3 w-3" />
          {t("p2p_market_escrow_badge")}
        </span>
        {ad.countryCode ? (
          <span className="text-[10px] font-semibold text-stone-400">
            {countryLabel(locale, ad.countryCode)}
          </span>
        ) : null}
      </div>

      <div className="p-3">
        <div className="flex items-center gap-3">
          {icon ? (
            <Image src={icon} alt="" width={40} height={40} className="rounded-full" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-800 text-xs font-bold text-stone-200">
              {ad.asset.slice(0, 2)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-bold ${isSellAd ? "text-rose-300" : "text-emerald-300"}`}
            >
              {isSellAd ? t("p2p_side_sell") : t("p2p_side_buy")} · {ad.asset}/{ad.fiatCurrency}
            </p>
            <p className="text-lg font-bold tabular-nums text-stone-50">
              {fmt(ad.price, ad.fiatCurrency)}
              <span className="text-xs font-normal text-stone-400"> / {ad.asset}</span>
            </p>
            <p className="text-[10px] text-stone-500">
              {fmt(ad.minFiat, ad.fiatCurrency)} — {fmt(ad.maxFiat, ad.fiatCurrency)}
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-stone-400">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${
              isSellAd
                ? "bg-rose-950/50 text-rose-200 ring-rose-800/40"
                : "bg-emerald-950/50 text-emerald-200 ring-emerald-800/40"
            }`}
          >
            {isSellAd ? <P2pIconBuy className="h-3 w-3" /> : <P2pIconSell className="h-3 w-3" />}
            {roleHint}
          </span>
          <span className="truncate text-stone-300">{ad.makerName}</span>
          {ad.makerRating && ad.makerRating.count > 0 ? (
            <span className="inline-flex items-center gap-0.5 font-semibold text-amber-400">
              <P2pIconStar filled className="h-3 w-3" />
              {ad.makerRating.avg.toFixed(1)}
            </span>
          ) : null}
        </div>

        <p className="mt-2 line-clamp-1 text-[10px] text-stone-500">{ad.paymentMethods}</p>

        <Link
          href={`/app/p2p/ad/${ad.id}/trade`}
          className={`mt-3 flex min-h-[44px] items-center justify-center gap-2 rounded-xl text-sm font-bold text-white active:scale-[0.99] ${
            isSellAd ? "bg-rose-600" : "bg-emerald-700"
          }`}
        >
          {isSellAd ? <P2pIconBuy className="h-4 w-4" /> : <P2pIconSell className="h-4 w-4" />}
          {isSellAd ? t("p2p_cta_buy") : t("p2p_cta_sell")}
        </Link>
      </div>
    </li>
  );
}
