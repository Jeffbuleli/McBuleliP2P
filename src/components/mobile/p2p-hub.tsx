"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { countryLabel } from "@/lib/country-label";
import type { Messages } from "@/i18n/messages";
import {
  P2pStatusIcon,
  p2pStatusBadgeClasses,
  p2pStatusLabelKey,
} from "@/components/p2p/p2p-status-badge";
import {
  P2P_COUNTRY_CODES,
  P2P_FIAT_CURRENCIES,
  type P2pCryptoAsset,
  type P2pSide,
} from "@/lib/p2p-config";

type MarketAd = {
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
  createdAt: string;
  makerMasked: string;
  makerRating: { avg: number; count: number } | null;
};

type MyAd = {
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
  status: string;
  createdAt: string;
};

type OrderRow = {
  id: string;
  adId: string;
  side: P2pSide;
  asset: string;
  fiatCurrency: string;
  fiatAmount: string;
  cryptoAmount: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  role: "maker" | "taker";
};

export function P2PHub() {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<"market" | "ads" | "orders">("market");
  const [asset, setAsset] = useState<P2pCryptoAsset | "">("");
  const [fiat, setFiat] = useState("");
  const [side, setSide] = useState<P2pSide | "">("");
  const [country, setCountry] = useState("");
  const [paymentContains, setPaymentContains] = useState("");
  const [marketAds, setMarketAds] = useState<MarketAd[] | null>(null);
  const [myAds, setMyAds] = useState<MyAd[] | null>(null);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMarket = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (asset) q.set("asset", asset);
      if (fiat) q.set("fiat", fiat);
      if (side) q.set("side", side);
      if (country) q.set("country", country);
      const res = await fetch(`/api/p2p/market?${q.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMarketAds([]);
        return;
      }
      setMarketAds(data.ads as MarketAd[]);
    } finally {
      setLoading(false);
    }
  }, [asset, fiat, side, country]);

  const loadAds = useCallback(async () => {
    const res = await fetch("/api/p2p/ads");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMyAds([]);
      return;
    }
    setMyAds(data.ads as MyAd[]);
  }, []);

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/p2p/orders");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setOrders([]);
      return;
    }
    setOrders(data.orders as OrderRow[]);
  }, []);

  useEffect(() => {
    if (tab === "market") void loadMarket();
  }, [tab, loadMarket]);

  useEffect(() => {
    if (tab === "ads") void loadAds();
  }, [tab, loadAds]);

  useEffect(() => {
    if (tab === "orders") void loadOrders();
  }, [tab, loadOrders]);

  const locNum = locale === "fr" ? "fr-FR" : "en-US";

  const fmt = useMemo(
    () => (n: string, cur: string) => {
      const x = Number(n);
      if (!Number.isFinite(x)) return n;
      return `${x.toLocaleString(locNum, { maximumFractionDigits: 2 })} ${cur}`;
    },
    [locNum],
  );

  const filteredMarketAds = useMemo(() => {
    if (!marketAds) return null;
    const q = paymentContains.trim().toLowerCase();
    if (!q) return marketAds;
    return marketAds.filter((a) => a.paymentMethods.toLowerCase().includes(q));
  }, [marketAds, paymentContains]);

  async function patchAd(id: string, status: "active" | "paused" | "closed") {
    const res = await fetch(`/api/p2p/ads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) void loadAds();
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-10 pt-1">
      <div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">{t("p2p_title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {t("p2p_intro")}
        </p>
        <p className="mt-2 rounded-xl border border-amber-800/20 bg-amber-50/80 p-3 text-xs text-amber-950 dark:border-amber-700/30 dark:bg-amber-950/30 dark:text-amber-100">
          {t("p2p_disclaimer")}
        </p>
      </div>

      <div className="flex gap-1 rounded-2xl border border-stone-200 bg-stone-50 p-1 dark:border-stone-700 dark:bg-stone-900">
        {(
          [
            ["market", "p2p_tab_market"],
            ["ads", "p2p_tab_ads"],
            ["orders", "p2p_tab_orders"],
          ] as const
        ).map(([k, labelKey]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              tab === k
                ? "bg-emerald-700 text-white shadow dark:bg-emerald-600"
                : "text-stone-700 dark:text-stone-300"
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {tab === "market" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              {t("p2p_filter_asset")}
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value as P2pCryptoAsset | "")}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-2 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              >
                <option value="">{t("p2p_filter_all")}</option>
                <option value="USDT">USDT</option>
                <option value="PI">PI</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              {t("p2p_filter_fiat")}
              <select
                value={fiat}
                onChange={(e) => setFiat(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-2 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              >
                <option value="">{t("p2p_filter_all")}</option>
                {P2P_FIAT_CURRENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              {t("p2p_filter_side")}
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as P2pSide | "")}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-2 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              >
                <option value="">{t("p2p_filter_all")}</option>
                <option value="sell">{t("p2p_side_sell")}</option>
                <option value="buy">{t("p2p_side_buy")}</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
              {t("p2p_filter_country")}
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-2 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              >
                <option value="">{t("p2p_filter_all")}</option>
                {P2P_COUNTRY_CODES.map((c) => (
                  <option key={c} value={c}>
                    {countryLabel(locale, c)}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-2 block text-xs font-medium text-stone-700 dark:text-stone-300">
              {t("p2p_filter_payment")}
              <input
                type="search"
                value={paymentContains}
                onChange={(e) => setPaymentContains(e.target.value)}
                placeholder={t("p2p_filter_payment_hint")}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => void loadMarket()}
            disabled={loading}
            className="w-full rounded-xl border border-emerald-800/20 bg-emerald-50 py-2 text-sm font-semibold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
          >
            {loading ? "…" : t("continue")}
          </button>

          {!filteredMarketAds?.length ? (
            <p className="text-center text-sm text-stone-500">{t("p2p_no_ads")}</p>
          ) : (
            <ul className="space-y-3">
              {filteredMarketAds.map((a) => (
                <li
                  key={a.id}
                  className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900"
                >
                  <div
                    className={`flex items-center justify-between gap-2 border-b px-4 py-2 ${
                      a.side === "sell"
                        ? "border-rose-900/15 bg-rose-50/90 dark:border-rose-800/30 dark:bg-rose-950/35"
                        : "border-emerald-900/10 bg-emerald-50/80 dark:border-emerald-800/30 dark:bg-emerald-950/40"
                    }`}
                  >
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
                        a.side === "sell"
                          ? "bg-rose-600 dark:bg-rose-500"
                          : "bg-emerald-700 dark:bg-emerald-600"
                      }`}
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 016 0v3H9z" />
                      </svg>
                      {t("p2p_market_escrow_badge")}
                    </span>
                    {a.countryCode ? (
                      <span className="text-[10px] font-semibold text-stone-600 dark:text-stone-400">
                        {countryLabel(locale, a.countryCode)}
                      </span>
                    ) : null}
                  </div>
                  <div className="p-4">
                    <p
                      className={`text-xs font-semibold uppercase ${
                        a.side === "sell"
                          ? "text-rose-800 dark:text-rose-300"
                          : "text-emerald-800 dark:text-emerald-300"
                      }`}
                    >
                      {a.side === "sell" ? t("p2p_side_sell") : t("p2p_side_buy")} · {a.asset} /{" "}
                      {a.fiatCurrency}
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-stone-800 dark:text-stone-200">
                      {t("p2p_maker")}: {a.makerMasked}
                    </p>
                    {a.makerRating && a.makerRating.count > 0 ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-amber-500" aria-hidden>
                          ★★★★★
                        </span>
                        <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                          {a.makerRating.avg.toFixed(1)}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          ({a.makerRating.count} {t("p2p_maker_rating")})
                        </span>
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-stone-500">{t("p2p_maker_no_reviews")}</p>
                    )}
                    <p className="mt-3 text-sm text-stone-800 dark:text-stone-200">
                      <span className="font-medium">{t("p2p_price_label")}:</span>{" "}
                      {fmt(a.price, a.fiatCurrency)} / {a.asset}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      {t("p2p_limits_label")}: {fmt(a.minFiat, a.fiatCurrency)} —{" "}
                      {fmt(a.maxFiat, a.fiatCurrency)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-[11px] text-stone-600 dark:text-stone-400">
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {t("p2p_market_pays_via")}:{" "}
                      </span>
                      {a.paymentMethods}
                    </p>
                    {a.terms ? (
                      <p className="mt-1 line-clamp-2 text-[11px] text-stone-500">
                        <span className="font-medium">{t("p2p_market_terms_preview")}:</span> {a.terms}
                      </p>
                    ) : null}
                    <Link
                      href={`/app/p2p/ad/${a.id}/trade`}
                      className={`mt-4 flex min-h-[48px] items-center justify-center rounded-xl py-3 text-sm font-bold text-white shadow-md active:scale-[0.99] ${
                        a.side === "sell"
                          ? "bg-rose-600 dark:bg-rose-500"
                          : "bg-emerald-700 dark:bg-emerald-600"
                      }`}
                    >
                      {t("p2p_market_sticky_cta")}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "ads" ? (
        <div className="space-y-4">
          <Link
            href="/app/p2p/ad/new"
            className="flex min-h-[48px] items-center justify-center rounded-2xl bg-emerald-700 py-3 text-sm font-bold text-white dark:bg-emerald-600"
          >
            {t("p2p_post_ad")}
          </Link>
          {!myAds?.length ? (
            <p className="text-center text-sm text-stone-500">{t("p2p_ad_list_empty")}</p>
          ) : (
            <ul className="space-y-3">
              {myAds.map((a) => (
                <li
                  key={a.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900"
                >
                  <p
                    className={`text-sm font-semibold ${
                      a.side === "sell"
                        ? "text-rose-800 dark:text-rose-200"
                        : "text-emerald-800 dark:text-emerald-200"
                    }`}
                  >
                    {a.side === "sell" ? t("p2p_side_sell") : t("p2p_side_buy")} · {a.asset} /{" "}
                    {a.fiatCurrency}
                  </p>
                  <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                    {t("p2p_price_label")}: {fmt(a.price, a.fiatCurrency)} · {t("p2p_limits_label")}:{" "}
                    {fmt(a.minFiat, a.fiatCurrency)} — {fmt(a.maxFiat, a.fiatCurrency)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-stone-700 dark:text-stone-300">
                    {t("p2p_ad_status")}:{" "}
                    {a.status === "active"
                      ? t("p2p_ad_active")
                      : a.status === "paused"
                        ? t("p2p_ad_paused")
                        : t("p2p_ad_closed")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => void patchAd(a.id, "paused")}
                        className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold dark:border-stone-600"
                      >
                        {t("p2p_ad_pause")}
                      </button>
                    ) : null}
                    {a.status === "paused" ? (
                      <button
                        type="button"
                        onClick={() => void patchAd(a.id, "active")}
                        className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold dark:border-stone-600"
                      >
                        {t("p2p_ad_resume")}
                      </button>
                    ) : null}
                    {a.status !== "closed" ? (
                      <button
                        type="button"
                        onClick={() => void patchAd(a.id, "closed")}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-800 dark:border-rose-700 dark:text-rose-200"
                      >
                        {t("p2p_ad_close")}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "orders" ? (
        <div className="space-y-3">
          {!orders?.length ? (
            <p className="text-center text-sm text-stone-500">{t("p2p_orders_empty")}</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/app/p2p/order/${o.id}`}
                    className="block rounded-2xl border border-stone-200 bg-white p-4 transition active:scale-[0.99] dark:border-stone-700 dark:bg-stone-900"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                        {fmt(o.fiatAmount, o.fiatCurrency)} → {o.cryptoAmount} {o.asset}
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${p2pStatusBadgeClasses(o.status)}`}
                      >
                        <P2pStatusIcon status={o.status} />
                        {t(p2pStatusLabelKey(o.status))}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      {o.role === "maker" ? t("p2p_maker") : t("p2p_taker")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
