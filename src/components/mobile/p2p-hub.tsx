"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { countryLabel } from "@/lib/country-label";
import { clientErrorText } from "@/lib/client-error-text";
import { p2pBoostFeeUsdt } from "@/lib/p2p-config";
import { P2pHubHeader } from "@/components/p2p/p2p-hub-header";
import { P2pMarketAdCard } from "@/components/p2p/p2p-market-ad-card";
import { P2pMyAdCard } from "@/components/p2p/p2p-my-ad-card";
import { P2pOrderListRow } from "@/components/p2p/p2p-order-list-row";
import { FlowMarketViewTabs, FlowSelect, FlowTabBar } from "@/components/p2p/p2p-flow-ui";
import type { P2pMarketView, P2pPaymentKindFilter } from "@/lib/p2p-market-view";
import {
  P2P_COUNTRY_CODES,
  p2pAllowedQuoteFiats,
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
  makerName: string;
  makerAvatarUrl?: string | null;
  makerRating: { avg: number; count: number } | null;
  makerTradeCount?: number;
  reserveRemainingCrypto?: string | null;
  boostedUntil: string | null;
  boostAmountPi: string;
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
  boostedUntil: string | null;
  boostAmountPi: string;
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

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("tab");
    if (q === "market" || q === "ads" || q === "orders") {
      setTab(q);
    }
  }, []);

  const selectTab = useCallback((k: "market" | "ads" | "orders") => {
    setTab(k);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", k);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, []);

  const [marketView, setMarketView] = useState<P2pMarketView>("buy");
  const [paymentKind, setPaymentKind] = useState<P2pPaymentKindFilter>("all");
  const [asset, setAsset] = useState<P2pCryptoAsset | "">("");
  const [fiat, setFiat] = useState("");
  const [country, setCountry] = useState("");
  const [boostedOnly, setBoostedOnly] = useState(false);
  const [trustedOnly, setTrustedOnly] = useState(false);
  const [marketAds, setMarketAds] = useState<MarketAd[] | null>(null);
  const [myAds, setMyAds] = useState<MyAd[] | null>(null);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [boostBusyId, setBoostBusyId] = useState<string | null>(null);
  const [boostMsg, setBoostMsg] = useState<string | null>(null);

  const loadMarket = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set("view", marketView);
      if (asset) q.set("asset", asset);
      if (fiat) q.set("fiat", fiat);
      if (country) q.set("country", country);
      if (paymentKind !== "all") q.set("paymentKind", paymentKind);
      if (boostedOnly) q.set("boosted", "1");
      if (trustedOnly) q.set("trusted", "1");
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
  }, [asset, fiat, marketView, country, paymentKind, boostedOnly, trustedOnly]);

  const loadAds = useCallback(async () => {
    const res = await fetch("/api/p2p/ads");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMyAds([]);
      return;
    }
    setMyAds(data.ads as MyAd[]);
  }, []);

  const boostFeeUsdt = useMemo(() => p2pBoostFeeUsdt(), []);

  async function boostAd(adId: string) {
    setBoostMsg(null);
    setBoostBusyId(adId);
    try {
      const res = await fetch(`/api/p2p/ads/${adId}/boost`, {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err =
          typeof data.error === "string" ? data.error : "p2p_boost_failed";
        setBoostMsg(clientErrorText(t, err));
        return;
      }
      setBoostMsg(t("p2p_boost_success"));
      void loadAds();
      void loadMarket();
    } finally {
      setBoostBusyId(null);
    }
  }

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
    if (marketView === "sell" && (fiat === "USDT" || fiat === "PI")) {
      setFiat("");
    }
  }, [marketView, fiat]);

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

  async function patchAd(id: string, status: "active" | "paused" | "closed") {
    const res = await fetch(`/api/p2p/ads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) void loadAds();
  }

  const tabOptions = useMemo(
    () =>
      [
        { id: "market" as const, label: t("p2p_tab_market") },
        { id: "ads" as const, label: t("p2p_tab_ads") },
        { id: "orders" as const, label: t("p2p_tab_orders") },
      ] satisfies { id: "market" | "ads" | "orders"; label: string }[],
    [t],
  );

  return (
    <div className="-mx-1 space-y-3 pb-10 pt-1">
      <P2pHubHeader />

      <FlowTabBar options={tabOptions} value={tab} onChange={selectTab} />

      {tab === "market" ? (
        <div className="space-y-3">
          <FlowMarketViewTabs
            value={marketView}
            onChange={setMarketView}
            buyLabel={t("p2p_market_tab_buy")}
            sellLabel={t("p2p_market_tab_sell")}
          />

          <div className="fd-card flex flex-wrap items-center gap-1.5 p-2">
            <FlowSelect
              value={asset}
              onChange={(e) => setAsset(e.target.value as P2pCryptoAsset | "")}
              className="!min-h-0 !py-1.5 !text-[11px] !rounded-xl flex-1 min-w-[4.5rem]"
            >
              <option value="">{t("p2p_filter_asset")}</option>
              <option value="USDT">USDT</option>
              <option value="PI">PI</option>
            </FlowSelect>
            <FlowSelect
              value={fiat}
              onChange={(e) => setFiat(e.target.value)}
              className="!min-h-0 !py-1.5 !text-[11px] !rounded-xl flex-1 min-w-[4.5rem]"
            >
              <option value="">{t("p2p_filter_quote")}</option>
              {(marketView === "sell"
                ? p2pAllowedQuoteFiats().filter((f) => f !== "USDT" && f !== "PI")
                : p2pAllowedQuoteFiats()
              ).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </FlowSelect>
            <FlowSelect
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="!min-h-0 !py-1.5 !text-[11px] !rounded-xl flex-[1.4] min-w-[5rem]"
            >
              <option value="">{t("p2p_filter_country")}</option>
              {P2P_COUNTRY_CODES.map((c) => (
                <option key={c} value={c}>
                  {countryLabel(locale, c)}
                </option>
              ))}
            </FlowSelect>
            {(
              [
                { id: "all" as const, label: t("p2p_payment_kind_all") },
                { id: "mobile" as const, label: "MoMo" },
                { id: "bank" as const, label: t("p2p_payment_kind_bank") },
              ] as const
            ).map((chip) => {
              const on = paymentKind === chip.id;
              const accent =
                marketView === "buy"
                  ? on
                    ? "bg-[color:var(--fd-primary)] text-white"
                    : "bg-white text-[color:var(--fd-muted)]"
                  : on
                    ? "bg-[color:var(--fd-sell)] text-white"
                    : "bg-white text-[color:var(--fd-muted)]";
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setPaymentKind(chip.id)}
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ring-[color:var(--fd-border)] ${accent}`}
                >
                  {chip.label}
                </button>
              );
            })}
            {loading ? (
              <span className="px-1 text-[10px] text-[color:var(--fd-muted)]">…</span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBoostedOnly((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                boostedOnly
                  ? "bg-amber-50 text-amber-800 ring-amber-300"
                  : "bg-white text-[color:var(--fd-muted)] ring-[color:var(--fd-border)]"
              }`}
            >
              {t("p2p_filter_boosted")}
            </button>
            <button
              type="button"
              onClick={() => setTrustedOnly((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                trustedOnly
                  ? marketView === "buy"
                    ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ring-[color:var(--fd-primary)]/30"
                    : "bg-[color:var(--fd-sell-mint)] text-[color:var(--fd-sell)] ring-[color:var(--fd-sell)]/30"
                  : "bg-white text-[color:var(--fd-muted)] ring-[color:var(--fd-border)]"
              }`}
            >
              {t("p2p_filter_trusted")}
            </button>
          </div>

          {!marketAds?.length ? (
            <p className="py-6 text-center text-sm text-[color:var(--fd-muted)]">{t("p2p_no_ads")}</p>
          ) : (
            <ul className="space-y-3">
              {marketAds.map((a) => (
                <P2pMarketAdCard
                  key={a.id}
                  ad={a}
                  locale={locale}
                  fmt={fmt}
                  marketView={marketView}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "ads" ? (
        <div className="space-y-3">
          <Link
            href="/app/p2p/ad/new"
            className="fd-btn-soft flex min-h-[52px] w-full items-center justify-center rounded-2xl text-base font-bold active:scale-[0.98]"
          >
            {t("p2p_post_ad")}
          </Link>
          {!myAds?.length ? (
            <p className="py-6 text-center text-sm text-[color:var(--fd-muted)]">
              {t("p2p_ad_list_empty")}
            </p>
          ) : (
            <ul className="space-y-3">
              {myAds.map((a) => (
                <P2pMyAdCard
                  key={a.id}
                  ad={a}
                  fmt={fmt}
                  locale={locale}
                  boostBusy={boostBusyId === a.id}
                  onPause={() => void patchAd(a.id, "paused")}
                  onResume={() => void patchAd(a.id, "active")}
                  onBoost={() => void boostAd(a.id)}
                  onClose={() => void patchAd(a.id, "closed")}
                />
              ))}
            </ul>
          )}
          {boostMsg ? (
            <p className="text-center text-xs text-[color:var(--fd-muted)]">{boostMsg}</p>
          ) : null}
        </div>
      ) : null}

      {tab === "orders" ? (
        <div className="space-y-3">
          {!orders?.length ? (
            <p className="py-6 text-center text-sm text-[color:var(--fd-muted)]">
              {t("p2p_orders_empty")}
            </p>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => (
                <P2pOrderListRow key={o.id} order={o} fmt={fmt} locale={locale} />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
