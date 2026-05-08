"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
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
    if (submitErr.startsWith("p2p_") || submitErr.startsWith("wallet_")) {
      return t(submitErr as keyof Messages);
    }
    return submitErr;
  }, [submitErr, t]);

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
        <Link href="/app/p2p" className="text-sm font-medium text-emerald-800 underline">
          ← {t("p2p_title")}
        </Link>
        <p className="text-sm text-rose-700 dark:text-rose-300">
          {t(loadErr as keyof Messages)}
        </p>
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

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-10 pt-1">
      <Link
        href="/app/p2p"
        className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400"
      >
        ← {t("p2p_title")}
      </Link>

      <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">{t("p2p_take_trade")}</h1>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm dark:border-stone-700 dark:bg-stone-900">
        <p className="font-semibold text-emerald-900 dark:text-emerald-200">
          {ad.side === "sell" ? t("p2p_side_sell") : t("p2p_side_buy")} · {ad.asset} / {ad.fiatCurrency}
        </p>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          {t("p2p_maker")}: {ad.makerName}
          {ad.countryCode ? ` · ${ad.countryCode}` : ""}
          {ad.makerRating && ad.makerRating.count > 0 ? (
            <span className="ml-1 font-medium text-amber-800 dark:text-amber-300">
              · {t("p2p_maker_rating")} {ad.makerRating.avg.toFixed(1)} ★ (
              {ad.makerRating.count})
            </span>
          ) : null}
        </p>
        <p className="mt-2">
          {t("p2p_price_label")}:{" "}
          <strong>
            {Number(ad.price).toLocaleString(locNum, { maximumFractionDigits: 8 })} {ad.fiatCurrency}{" "}
            / {ad.asset}
          </strong>
        </p>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          {t("p2p_limits_label")}: {Number(ad.minFiat).toLocaleString(locNum)} —{" "}
          {Number(ad.maxFiat).toLocaleString(locNum)} {ad.fiatCurrency}
        </p>
      </div>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("p2p_order_fiat_amount")}
        <input
          value={fiatAmount}
          onChange={(e) => setFiatAmount(e.target.value)}
          inputMode="decimal"
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-lg tabular-nums dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          placeholder="0"
        />
      </label>

      <div className="rounded-xl border border-emerald-900/15 bg-emerald-50/70 p-3 text-sm dark:border-emerald-800/30 dark:bg-emerald-950/30">
        <p className="font-medium text-emerald-950 dark:text-emerald-100">
          ≈ {estCrypto ?? "—"} {ad.asset}
        </p>
      </div>

      {errMsg ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
          {errMsg}
        </p>
      ) : null}

      <button
        type="button"
        disabled={loading || !fiatAmount.trim()}
        onClick={() => void confirm()}
        className="w-full rounded-2xl bg-emerald-700 py-3.5 text-lg font-semibold text-white disabled:opacity-40"
      >
        {loading ? "…" : t("p2p_order_start")}
      </button>
    </div>
  );
}
