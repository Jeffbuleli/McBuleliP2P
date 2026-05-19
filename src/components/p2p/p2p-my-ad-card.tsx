"use client";

import Image from "next/image";
import { useI18n } from "@/components/i18n-provider";
import { P2pIconEscrow } from "@/components/p2p/p2p-icons";

const ASSET_ICON: Record<string, string> = {
  USDT: "/assets/crypto/usdt.png",
  PI: "/assets/crypto/pi.png",
};

export type P2pMyAd = {
  id: string;
  side: string;
  asset: string;
  fiatCurrency: string;
  price: string;
  minFiat: string;
  maxFiat: string;
  status: string;
  boostedUntil: string | null;
};

export function P2pMyAdCard({
  ad,
  fmt,
  locale,
  boostBusy,
  onPause,
  onResume,
  onBoost,
  onClose,
}: {
  ad: P2pMyAd;
  fmt: (n: string, cur: string) => string;
  locale: string;
  boostBusy: boolean;
  onPause: () => void;
  onResume: () => void;
  onBoost: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const isSell = ad.side === "sell";
  const icon = ASSET_ICON[ad.asset];
  const statusLabel =
    ad.status === "active"
      ? t("p2p_ad_active")
      : ad.status === "paused"
        ? t("p2p_ad_paused")
        : t("p2p_ad_closed");

  return (
    <li className="overflow-hidden rounded-2xl border border-stone-700 bg-stone-900 p-0 shadow-sm">
      <div
        className={`flex items-center gap-3 border-b px-3 py-2 ${
          isSell ? "border-rose-900/30 bg-rose-950/35" : "border-emerald-900/30 bg-emerald-950/40"
        }`}
      >
        {icon ? (
          <Image src={icon} alt="" width={36} height={36} className="rounded-full" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-800 text-xs font-bold text-stone-200">
            {ad.asset.slice(0, 2)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold ${isSell ? "text-rose-300" : "text-emerald-300"}`}>
            {isSell ? t("p2p_side_sell") : t("p2p_side_buy")} · {ad.asset}/{ad.fiatCurrency}
          </p>
          <p className="text-lg font-bold tabular-nums text-stone-50">
            {fmt(ad.price, ad.fiatCurrency)}
            <span className="text-xs font-normal text-stone-400"> / {ad.asset}</span>
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            ad.status === "active"
              ? "bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-600/40"
              : ad.status === "paused"
                ? "bg-amber-600/20 text-amber-200 ring-1 ring-amber-600/40"
                : "bg-stone-700 text-stone-400 ring-1 ring-stone-600"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="space-y-2 p-3">
        <p className="text-[10px] text-stone-400">
          {fmt(ad.minFiat, ad.fiatCurrency)} — {fmt(ad.maxFiat, ad.fiatCurrency)}
        </p>
        {ad.boostedUntil && new Date(ad.boostedUntil).getTime() > Date.now() ? (
          <p className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300">
            <P2pIconEscrow className="h-3 w-3" />
            {t("p2p_boosted_until")}{" "}
            {new Date(ad.boostedUntil).toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
              month: "short",
              day: "2-digit",
            })}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          {ad.status === "active" ? (
            <button
              type="button"
              onClick={onPause}
              className="rounded-lg border border-stone-600 px-3 py-1.5 text-xs font-semibold text-stone-200"
            >
              {t("p2p_ad_pause")}
            </button>
          ) : null}
          {ad.status === "active" ? (
            <button
              type="button"
              disabled={boostBusy}
              onClick={onBoost}
              className="rounded-lg border border-amber-700 px-3 py-1.5 text-xs font-semibold text-amber-200 disabled:opacity-60"
            >
              {boostBusy ? t("p2p_boost_busy") : t("p2p_boost")}
            </button>
          ) : null}
          {ad.status === "paused" ? (
            <button
              type="button"
              onClick={onResume}
              className="rounded-lg border border-stone-600 px-3 py-1.5 text-xs font-semibold text-stone-200"
            >
              {t("p2p_ad_resume")}
            </button>
          ) : null}
          {ad.status !== "closed" ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-rose-800 px-3 py-1.5 text-xs font-semibold text-rose-300"
            >
              {t("p2p_ad_close")}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
