"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  P2pIconBuy,
  P2pIconEscrow,
  P2pIconSell,
  P2pIconStar,
} from "@/components/p2p/p2p-icons";
import type { Messages } from "@/i18n/messages";
import type { P2pSide } from "@/lib/p2p-config";

type AdDetail = {
  id: string;
  side: P2pSide;
  asset: string;
  fiatCurrency: string;
  price: string;
  minFiat: string;
  maxFiat: string;
  paymentMethods: string;
  terms: string | null;
  countryCode: string | null;
  makerName: string;
  makerAvatarUrl: string | null;
  makerRating: { avg: number; count: number } | null;
};

const ASSET_ICON: Record<string, string> = {
  USDT: "/assets/crypto/usdt.png",
  PI: "/assets/crypto/pi.png",
};

export default function P2pTradePage() {
  const params = useParams();
  const adId = typeof params.adId === "string" ? params.adId : "";
  const { t, locale } = useI18n();
  const router = useRouter();
  const [ad, setAd] = useState<AdDetail | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [fiatAmount, setFiatAmount] = useState("");
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoadErr(null);
    const res = await fetch(`/api/p2p/ads/${adId}/detail`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoadErr(typeof data.error === "string" ? data.error : "p2p_ad_not_found");
      setAd(null);
      return;
    }
    setAd(data.ad as AdDetail);
  }, [adId]);

  useEffect(() => {
    if (adId) void load();
  }, [adId, load]);

  const locNum = locale === "fr" ? "fr-FR" : "en-US";
  const isCryptoQuote =
    ad?.fiatCurrency?.toUpperCase() === "USDT" || ad?.fiatCurrency?.toUpperCase() === "PI";

  const estCrypto = useMemo(() => {
    if (!ad || !fiatAmount.trim()) return null;
    const fiat = Number(fiatAmount.replace(",", "."));
    const price = Number(ad.price);
    if (!Number.isFinite(fiat) || !Number.isFinite(price) || price <= 0) return null;
    const c = fiat / price;
    if (!Number.isFinite(c) || c <= 0) return null;
    return c.toLocaleString(locNum, { maximumFractionDigits: 12 });
  }, [ad, fiatAmount, locNum]);

  const errMsg = useMemo(() => {
    if (!submitErr) return null;
    if (submitErr === "wallet_insufficient_balance" && ad?.side === "sell") {
      return t("p2p_sell_insufficient_balance");
    }
    if (submitErr === "wallet_insufficient_balance" && ad?.side === "buy") {
      return t("p2p_buy_escrow_insufficient_balance");
    }
    if (submitErr.startsWith("p2p_") || submitErr.startsWith("wallet_")) {
      return t(submitErr as keyof Messages);
    }
    return submitErr;
  }, [submitErr, t, ad?.side]);

  async function confirm() {
    setSubmitErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/p2p/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId, fiatAmount: fiatAmount.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitErr(typeof data.error === "string" ? data.error : "p2p_invalid_limits");
        return;
      }
      const orderId = typeof data.orderId === "string" ? data.orderId : "";
      if (orderId) {
        router.push(`/app/p2p/order/${orderId}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (loadErr) {
    return (
      <div className="mx-auto max-w-lg space-y-4 pb-10 pt-1">
        <Link href="/app/p2p" className="text-sm font-medium text-emerald-400 underline">
          ← {t("p2p_title")}
        </Link>
        <p className="text-sm text-rose-300">{t(loadErr as keyof Messages)}</p>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center text-sm text-stone-500">
        {t("deposit_loading")}
      </div>
    );
  }

  const isSellAd = ad.side === "sell";
  const icon = ASSET_ICON[ad.asset];
  const roleHint = isSellAd ? t("p2p_trade_role_buy_short") : t("p2p_trade_role_sell_short");

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-10 pt-1">
      <Link href="/app/p2p" className="text-sm font-medium text-emerald-400 underline">
        ← {t("p2p_title")}
      </Link>

      <h1 className="text-xl font-bold text-stone-50">{t("p2p_take_trade")}</h1>

      <div className="overflow-hidden rounded-2xl border border-stone-700 bg-stone-900">
        <div
          className={`flex items-center gap-3 border-b px-3 py-3 ${
            isSellAd ? "border-rose-900/30 bg-rose-950/35" : "border-emerald-900/30 bg-emerald-950/40"
          }`}
        >
          {icon ? (
            <Image src={icon} alt="" width={44} height={44} className="rounded-full" />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold ${isSellAd ? "text-rose-300" : "text-emerald-300"}`}>
              {isSellAd ? t("p2p_side_sell") : t("p2p_side_buy")} · {ad.asset}/{ad.fiatCurrency}
            </p>
            <p className="text-lg font-bold tabular-nums text-stone-50">
              {Number(ad.price).toLocaleString(locNum, { maximumFractionDigits: 8 })}{" "}
              {ad.fiatCurrency}
              <span className="text-xs font-normal text-stone-400"> / {ad.asset}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2 p-3">
          <p
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isSellAd
                ? "bg-rose-950/60 text-rose-200 ring-1 ring-rose-800/50"
                : "bg-emerald-950/60 text-emerald-200 ring-1 ring-emerald-800/50"
            }`}
          >
            {isSellAd ? <P2pIconBuy className="h-3.5 w-3.5" /> : <P2pIconSell className="h-3.5 w-3.5" />}
            {roleHint}
          </p>

          {isCryptoQuote ? (
            <p className="flex items-center gap-1.5 text-[10px] text-stone-400">
              <P2pIconEscrow className="h-3 w-3" />
              {t("p2p_crypto_quote_take_hint").replace("{quote}", ad.fiatCurrency)}
            </p>
          ) : null}

          <p className="flex flex-wrap items-center gap-2 text-[10px] text-stone-400">
            <span className="text-stone-300">{ad.makerName}</span>
            {ad.makerRating && ad.makerRating.count > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-amber-400">
                <P2pIconStar filled className="h-3 w-3" />
                {ad.makerRating.avg.toFixed(1)}
              </span>
            ) : null}
            <span>
              {Number(ad.minFiat).toLocaleString(locNum)} — {Number(ad.maxFiat).toLocaleString(locNum)}{" "}
              {ad.fiatCurrency}
            </span>
          </p>
        </div>
      </div>

      <label className="block text-sm font-medium text-stone-200">
        {t("p2p_order_fiat_amount")}
        <input
          value={fiatAmount}
          onChange={(e) => setFiatAmount(e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-xl border border-stone-600 bg-stone-900 px-3 py-3 text-lg tabular-nums text-stone-100 outline-none ring-emerald-500/40 focus:ring-2"
          placeholder="0"
        />
      </label>

      <div className="rounded-xl border border-emerald-800/30 bg-emerald-950/30 p-3 text-center">
        <p className="text-xs text-stone-400">{ad.asset}</p>
        <p className="text-2xl font-bold tabular-nums text-emerald-200">≈ {estCrypto ?? "—"}</p>
      </div>

      {errMsg ? (
        <p className="rounded-lg bg-rose-950/40 px-3 py-2 text-sm text-rose-100">{errMsg}</p>
      ) : null}

      <button
        type="button"
        disabled={loading || !fiatAmount.trim()}
        onClick={() => void confirm()}
        className={`w-full rounded-2xl py-3.5 text-lg font-semibold text-white disabled:opacity-40 ${
          isSellAd ? "bg-rose-600" : "bg-emerald-700"
        }`}
      >
        {loading ? "…" : t("p2p_order_start")}
      </button>
    </div>
  );
}
