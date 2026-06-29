"use client";

import Image from "next/image";
import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/i18n/messages";
import { P2pIconEscrow } from "@/components/p2p/p2p-icons";
import { p2pBoostFeeUsdt } from "@/lib/p2p-config";

const ASSET_ICON: Record<string, string> = {
  USDT: "/assets/crypto/usdt.png",
  PI: "/assets/crypto/pi.png",
};

const P2P_BTN =
  "rounded-xl border border-white/12 bg-[#0a1018]/85 px-3 py-1.5 text-xs font-semibold text-[color:var(--fd-text)] transition active:scale-[0.98]";

export type P2pMyAd = {
  id: string;
  side: string;
  asset: string;
  fiatCurrency: string;
  price: string;
  minFiat: string;
  maxFiat: string;
  terms?: string | null;
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
  onEdit,
}: {
  ad: P2pMyAd;
  fmt: (n: string, cur: string) => string;
  locale: string;
  boostBusy: boolean;
  onPause: () => void;
  onResume: () => void;
  onBoost: () => void;
  onClose: () => void;
  onEdit?: () => void;
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
    <li className="fd-card overflow-hidden p-0">
      <div className="flex items-center gap-3 border-b border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/30 px-3 py-2">
        {icon ? (
          <Image src={icon} alt="" width={36} height={36} className="rounded-full" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-xs font-bold text-[color:var(--fd-primary)]">
            {ad.asset.slice(0, 2)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[color:var(--fd-muted)]">
            {isSell ? t("p2p_side_sell") : t("p2p_side_buy")} · {ad.asset}/{ad.fiatCurrency}
          </p>
          <p className="text-lg font-bold tabular-nums text-[color:var(--fd-text)]">
            {fmt(ad.price, ad.fiatCurrency)}
            <span className="text-xs font-semibold text-[color:var(--fd-muted)]"> / {ad.asset}</span>
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            ad.status === "active"
              ? "border border-emerald-400/35 bg-emerald-500/15 text-emerald-300"
              : ad.status === "paused"
                ? "border border-amber-400/35 bg-amber-500/15 text-amber-300"
                : "border border-white/10 bg-[#0a1018]/85 text-[color:var(--fd-muted)]"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="space-y-2 p-3">
        <p className="text-[10px] text-[color:var(--fd-muted)]">
          {fmt(ad.minFiat, ad.fiatCurrency)} - {fmt(ad.maxFiat, ad.fiatCurrency)}
        </p>
        {ad.boostedUntil && new Date(ad.boostedUntil).getTime() > Date.now() ? (
          <p className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
            <P2pIconEscrow className="h-3 w-3" />
            {t("p2p_boosted_until")}{" "}
            {new Date(ad.boostedUntil).toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
              month: "short",
              day: "2-digit",
            })}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          {ad.status !== "closed" && onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className={P2P_BTN}
            >
              {t("p2p_ad_edit")}
            </button>
          ) : null}
          {ad.status === "active" ? (
            <button
              type="button"
              onClick={onPause}
              className={P2P_BTN}
            >
              {t("p2p_ad_pause")}
            </button>
          ) : null}
          {ad.status === "active" ? (
            <button
              type="button"
              disabled={boostBusy}
              onClick={onBoost}
              className="rounded-xl border border-amber-400/35 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 disabled:opacity-60"
            >
              {boostBusy
                ? t("p2p_boost_busy")
                : interpolate(t("p2p_boost_usdt_note"), { amount: p2pBoostFeeUsdt() })}
            </button>
          ) : null}
          {ad.status === "paused" ? (
            <button
              type="button"
              onClick={onResume}
              className={P2P_BTN}
            >
              {t("p2p_ad_resume")}
            </button>
          ) : null}
          {ad.status !== "closed" ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-rose-400/35 bg-rose-500/12 px-3 py-1.5 text-xs font-semibold text-rose-300"
            >
              {t("p2p_ad_close")}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
