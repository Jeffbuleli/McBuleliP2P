"use client";

import { useEffect, useMemo, useState } from "react";
import { SessionAppLink } from "@/components/landing/session-app-link";
import type { MarketTicker } from "@/lib/market-tickers";
import { TICKERS_POLL_MS } from "@/lib/market-live";
import { marketIconUrl } from "@/lib/market-icons";
import { useI18n } from "@/components/i18n-provider";
import { AssetAvatar } from "@/components/landing/v2/landing-asset-avatar";

type TabId = "all" | "p2p" | "wallet" | "earn";

type MarketRow = {
  id: string;
  name: string;
  symbol: string;
  icon: string | null;
  badge?: string;
  badgeClass?: string;
  price: string;
  changePct?: number;
  changeLabel?: string;
  showSparkline: boolean;
  payment: string;
  action: string;
  href: string;
  tabs: TabId[];
};

function formatPrice(symbol: string, price: string): string {
  const n = Number(price);
  if (!Number.isFinite(n)) return price;
  if (symbol.startsWith("BTC")) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 100) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

function MiniSparkline({ up, flat }: { up: boolean; flat?: boolean }) {
  const color = flat ? "#94A3B8" : up ? "#10B981" : "#F43F5E";
  const d = flat
    ? "M2 16 L78 16"
    : up
      ? "M2 24 L18 18 L32 22 L48 10 L62 14 L78 6"
      : "M2 8 L18 14 L32 10 L48 22 L62 18 L78 26";
  return (
    <svg className="h-8 w-20" viewBox="0 0 80 32" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChangeCell({ pct, label }: { pct?: number; label?: string }) {
  if (label) {
    return <span className="font-bold text-slate-600">{label}</span>;
  }
  const v = pct ?? 0;
  const up = v >= 0;
  return (
    <span className={`font-bold tabular-nums ${up ? "text-emerald-600" : "text-rose-600"}`}>
      {up ? "+" : ""}
      {v.toFixed(2)}%
    </span>
  );
}

export function LandingMarketTable({
  initialTickers,
}: {
  initialTickers: MarketTicker[] | null;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabId>("all");
  const [tickers, setTickers] = useState(initialTickers);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const res = await fetch("/api/market/tickers");
        const json = (await res.json()) as { tickers?: MarketTicker[] };
        if (!cancelled && Array.isArray(json.tickers)) setTickers(json.tickers);
      } catch {
        /* keep SSR */
      }
    };
    void pull();
    const id = window.setInterval(() => void pull(), TICKERS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const rows = useMemo((): MarketRow[] => {
    const list: MarketRow[] = [];
    const add = (row: MarketRow) => list.push(row);

    const btc = tickers?.find((x) => x.symbol === "BTCUSDT");
    const eth = tickers?.find((x) => x.symbol === "ETHUSDT");
    const pi = tickers?.find((x) => x.symbol === "PIUSDT");

    if (btc) {
      add({
        id: "btc",
        name: "Bitcoin",
        symbol: "BTC",
        icon: marketIconUrl(btc.symbol),
        price: formatPrice(btc.symbol, btc.lastPrice),
        changePct: btc.changePct,
        showSparkline: true,
        payment: t("landing_v2_pay_bank"),
        action: t("landing_v2_action_trade"),
        href: "/app/trade",
        tabs: ["all", "wallet"],
      });
    }

    add({
      id: "usdt",
      name: "Tether",
      symbol: "USDT",
      icon: marketIconUrl("USDT"),
      price: "$1.00",
      changeLabel: t("landing_v2_change_stable"),
      showSparkline: true,
      payment: t("landing_v2_pay_mobile"),
      action: t("landing_v2_action_p2p"),
      href: "/app/p2p",
      tabs: ["all", "p2p", "wallet"],
    });

    if (eth) {
      add({
        id: "eth",
        name: "Ethereum",
        symbol: "ETH",
        icon: marketIconUrl(eth.symbol),
        price: formatPrice(eth.symbol, eth.lastPrice),
        changePct: eth.changePct,
        showSparkline: true,
        payment: t("landing_v2_pay_bank"),
        action: t("landing_v2_action_trade"),
        href: "/app/trade",
        tabs: ["all", "wallet"],
      });
    }

    add({
      id: "pi",
      name: "Pi Network",
      symbol: "PI",
      icon: marketIconUrl("PIUSDT"),
      price: pi ? formatPrice(pi.symbol, pi.lastPrice) : t("landing_v2_price_p2p"),
      changePct: pi?.changePct ?? 0,
      showSparkline: true,
      payment: t("landing_v2_pay_airtel"),
      action: t("landing_v2_action_negotiate"),
      href: "/app/p2p",
      tabs: ["all", "p2p"],
    });

    add({
      id: "staking",
      name: t("landing_svc_staking_t"),
      symbol: "STAKE",
      badge: "ST",
      badgeClass: "bg-emerald-100 text-emerald-800",
      icon: null,
      price: t("landing_v2_yield_label"),
      changeLabel: t("landing_v2_market_metric_apy"),
      showSparkline: false,
      payment: "USDT · Pi",
      action: t("landing_v2_action_earn"),
      href: "/app/wallet/staking",
      tabs: ["all", "earn"],
    });

    add({
      id: "avec",
      name: "AVEC",
      symbol: "AVEC",
      badge: "AV",
      badgeClass: "bg-amber-100 text-amber-900",
      icon: null,
      price: t("landing_v2_avec_yield"),
      changeLabel: t("landing_v2_market_metric_collective"),
      showSparkline: false,
      payment: t("landing_v2_pay_group"),
      action: t("landing_v2_action_join"),
      href: "/app/wallet/groups",
      tabs: ["all", "earn"],
    });

    return list;
  }, [tickers, t]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "all", label: t("landing_v2_market_tab_all") },
    { id: "p2p", label: t("landing_v2_market_tab_p2p") },
    { id: "wallet", label: t("landing_v2_market_tab_wallet") },
    { id: "earn", label: t("landing_v2_market_tab_earn") },
  ];

  const filtered = rows.filter((r) => tab === "all" || r.tabs.includes(tab));

  return (
    <section id="market" className="scroll-mt-20 bg-[#fafaf9] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-stone-900 sm:text-2xl">{t("landing_v2_market_title")}</h2>
            <p className="mt-1 text-xs text-stone-500 sm:text-sm">{t("landing_market_sub")}</p>
          </div>
          <SessionAppLink href="/app/market" className="text-sm font-bold text-[#305F33] hover:underline">
            {t("landing_v2_market_see_all")} →
          </SessionAppLink>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setTab(x.id)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition ${
                tab === x.id ? "bg-[#305F33] text-white shadow-md shadow-emerald-900/15" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{t("landing_v2_col_asset")}</th>
                  <th className="px-4 py-3">{t("landing_v2_col_price")}</th>
                  <th className="px-4 py-3">{t("landing_v2_col_change")}</th>
                  <th className="hidden px-4 py-3 md:table-cell">7d</th>
                  <th className="px-4 py-3">{t("landing_v2_col_payment")}</th>
                  <th className="px-4 py-3 text-right">{t("landing_v2_col_action")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => {
                  const up = (row.changePct ?? 0) >= 0;
                  const flat = Boolean(row.changeLabel);
                  return (
                    <tr key={row.id} className="border-b border-stone-50 transition hover:bg-[#305F33]/[0.03]">
                      <td className="px-4 py-4 font-semibold tabular-nums text-slate-400">{index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <AssetAvatar
                            symbol={row.symbol}
                            name={row.name}
                            badge={row.badge}
                            badgeClass={row.badgeClass}
                          />
                          <div>
                            <p className="font-bold text-slate-900">{row.name}</p>
                            <p className="text-xs text-slate-400">{row.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-bold tabular-nums text-slate-900">{row.price}</td>
                      <td className="px-4 py-4">
                        <ChangeCell pct={row.changePct} label={row.changeLabel} />
                      </td>
                      <td className="hidden px-4 py-4 md:table-cell">
                        {row.showSparkline ? (
                          <MiniSparkline up={up} flat={flat} />
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{row.payment}</td>
                      <td className="px-4 py-4 text-right">
                        <SessionAppLink
                          href={row.href}
                          className="inline-flex rounded-lg bg-[#305F33]/10 px-3 py-1.5 text-xs font-bold text-[#305F33] transition hover:bg-[#305F33]/15"
                        >
                          {row.action}
                        </SessionAppLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
