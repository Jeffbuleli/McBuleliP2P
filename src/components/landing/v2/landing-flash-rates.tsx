"use client";

import { useEffect, useMemo, useState } from "react";
import type { MarketTicker } from "@/lib/market-tickers";
import { TICKERS_POLL_MS } from "@/lib/market-live";
import { useI18n } from "@/components/i18n-provider";
import { HudTabButton, HudTabGroup } from "@/components/landing/landing-hud-ui";
import { PARTNER_LOGO } from "@/lib/partner-logos";
import { AssetAvatar, formatLandingUsd } from "@/components/landing/v2/landing-asset-avatar";

type FlashTab = "crypto" | "p2p" | "wallet" | "earn";

type FlashCard = {
  id: string;
  pair: string;
  price: string;
  changePct?: number;
  changeLabel?: string;
  symbol?: string;
  partnerLogo?: string;
  badge?: string;
  badgeClass?: string;
  featured?: boolean;
};

function ChangeBadge({ pct, label }: { pct?: number; label?: string }) {
  if (label) {
    return (
      <span className="inline-flex rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-bold text-stone-400">
        {label}
      </span>
    );
  }
  const v = pct ?? 0;
  const up = v >= 0;
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
        up ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
      }`}
    >
      {up ? "+" : ""}
      {v.toFixed(2)}%
    </span>
  );
}

function FlashCardView({ card }: { card: FlashCard }) {
  return (
    <article
      className={`min-w-[11.5rem] flex-1 rounded-2xl border bg-[#0a1018]/90 p-4 backdrop-blur-sm transition sm:min-w-0 ${
        card.featured
          ? "border-cyan-500/30 shadow-[0_0_30px_-12px_rgba(34,211,238,0.4)]"
          : "border-white/8 hover:border-cyan-500/20"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <AssetAvatar
          symbol={card.symbol ?? ""}
          partnerLogo={card.partnerLogo}
          badge={card.badge}
          badgeClass={card.badgeClass}
        />
        <p className="text-sm font-bold leading-tight text-stone-200">{card.pair}</p>
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-white">{card.price}</p>
      <div className="mt-2">
        <ChangeBadge pct={card.changePct} label={card.changeLabel} />
      </div>
    </article>
  );
}

export function LandingFlashRates({
  initialTickers,
}: {
  initialTickers: MarketTicker[] | null;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<FlashTab>("crypto");
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

  const cards = useMemo((): FlashCard[] => {
    const find = (sym: string) => tickers?.find((x) => x.symbol === sym);
    const btc = find("BTCUSDT");
    const eth = find("ETHUSDT");
    const pi = find("PIUSDT");

    if (tab === "crypto") {
      return [
        {
          id: "btc",
          pair: "BTC / USD",
          price: btc ? formatLandingUsd("BTCUSDT", btc.lastPrice) : "-",
          changePct: btc?.changePct ?? 0,
          symbol: "BTC",
          featured: true,
        },
        {
          id: "eth",
          pair: "ETH / USD",
          price: eth ? formatLandingUsd("ETHUSDT", eth.lastPrice) : "-",
          changePct: eth?.changePct ?? 0,
          symbol: "ETH",
        },
        {
          id: "usdt",
          pair: "USDT / USD",
          price: "$1.00",
          changeLabel: t("landing_v2_change_stable"),
          symbol: "USDT",
        },
        {
          id: "pi",
          pair: "Pi / USD",
          price: pi ? formatLandingUsd("PIUSDT", pi.lastPrice) : "-",
          changePct: pi?.changePct ?? 0,
          symbol: "PI",
        },
      ];
    }

    if (tab === "p2p") {
      return [
        {
          id: "mpesa",
          pair: t("landing_v2_flash_mpesa"),
          price: t("landing_v2_flash_p2p_rate"),
          changePct: 0.12,
          partnerLogo: PARTNER_LOGO.mpesa!,
        },
        {
          id: "orange",
          pair: t("landing_v2_flash_orange"),
          price: t("landing_v2_flash_p2p_rate"),
          changePct: -0.05,
          partnerLogo: PARTNER_LOGO.orange!,
        },
        {
          id: "airtel",
          pair: t("landing_v2_flash_airtel"),
          price: t("landing_v2_flash_p2p_rate"),
          changePct: 0.22,
          partnerLogo: PARTNER_LOGO.airtel!,
        },
        {
          id: "afrimoney",
          pair: t("landing_v2_flash_afrimoney"),
          price: t("landing_v2_flash_p2p_rate"),
          changePct: 0.08,
          partnerLogo: PARTNER_LOGO.afrimoney!,
        },
      ];
    }

    if (tab === "wallet") {
      return [
        {
          id: "w-usdt",
          pair: t("landing_v2_flash_wallet_usdt"),
          price: "$1.00",
          changeLabel: t("landing_v2_flash_wallet_bal"),
          symbol: "USDT",
        },
        {
          id: "w-pi",
          pair: t("landing_v2_flash_wallet_pi"),
          price: pi ? formatLandingUsd("PIUSDT", pi.lastPrice) : "-",
          changeLabel: t("landing_v2_flash_wallet_bal"),
          symbol: "PI",
        },
        {
          id: "w-fiat",
          pair: t("landing_v2_flash_wallet_fiat"),
          price: "CDF",
          changeLabel: t("landing_v2_flash_wallet_bal"),
          badge: "FC",
          badgeClass: "bg-cyan-500/15 text-cyan-300",
        },
        {
          id: "w-multi",
          pair: t("landing_v2_flash_wallet_multi"),
          price: "USDT · Pi · Fiat",
          changeLabel: t("landing_v2_flash_wallet_bal"),
          badge: "3",
          badgeClass: "bg-fuchsia-500/15 text-fuchsia-300",
        },
      ];
    }

    return [
      {
        id: "e-usdt",
        pair: t("landing_v2_flash_earn_staking"),
        price: t("landing_v2_flash_earn_yield"),
        changeLabel: t("landing_v2_market_metric_apy"),
        symbol: "USDT",
      },
      {
        id: "e-pi",
        pair: t("landing_v2_flash_earn_pi"),
        price: t("landing_v2_flash_earn_yield"),
        changeLabel: t("landing_v2_market_metric_apy"),
        symbol: "PI",
      },
      {
        id: "e-avec",
        pair: t("landing_v2_flash_earn_avec"),
        price: t("landing_v2_avec_yield"),
        changeLabel: t("landing_v2_market_metric_collective"),
        badge: "AV",
        badgeClass: "bg-amber-500/15 text-amber-300",
      },
      {
        id: "e-btc",
        pair: "BTC / USD",
        price: btc ? formatLandingUsd("BTCUSDT", btc.lastPrice) : "-",
        changePct: btc?.changePct ?? 0,
        symbol: "BTC",
      },
    ];
  }, [tab, tickers, t]);

  const tabs: { id: FlashTab; label: string }[] = [
    { id: "crypto", label: t("landing_v2_tab_crypto") },
    { id: "p2p", label: t("landing_v2_tab_p2p") },
    { id: "wallet", label: t("landing_v2_tab_wallet") },
    { id: "earn", label: t("landing_v2_tab_earn") },
  ];

  return (
    <section id="rates" className="relative z-10 scroll-mt-20 -mt-4 px-4 sm:-mt-8 sm:px-6" aria-labelledby="flash-rates-h">
      <div className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-[#0a1018]/80 p-4 shadow-[0_0_40px_-16px_rgba(34,211,238,0.25)] sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="flash-rates-h" className="text-lg font-black text-white sm:text-xl">
              {t("landing_v2_flash_title")}
            </h2>
            <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">{t("landing_v2_flash_sub")}</p>
          </div>
          <HudTabGroup className="max-w-full">
            {tabs.map((x) => (
              <HudTabButton key={x.id} active={tab === x.id} onClick={() => setTab(x.id)}>
                {x.label}
              </HudTabButton>
            ))}
          </HudTabGroup>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 landing-scrollbar sm:grid sm:grid-cols-4 sm:overflow-visible">
          {cards.map((card) => (
            <FlashCardView key={`${tab}-${card.id}`} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
