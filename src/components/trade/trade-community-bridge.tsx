"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { TradeFlowCard } from "@/components/trade/trade-flow-ui";
import type { TradeAppMode } from "@/components/trade/trade-mode-bar";

export function TradeCommunityBridge({ mode }: { mode: TradeAppMode }) {
  const { t } = useI18n();

  return (
    <TradeFlowCard className="!border-[color:var(--fd-primary)]/20 !bg-gradient-to-br from-[color:var(--fd-mint)]/60 to-white !p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-primary)]">
        {t("trade_community_bridge_eyebrow")}
      </p>
      <p className="mt-1 text-xs font-semibold leading-snug text-[color:var(--fd-text)]">
        {mode === "demo"
          ? t("trade_community_bridge_demo")
          : t("trade_community_bridge_live")}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <Link
          href="/app/community/traders"
          className="rounded-xl bg-[color:var(--fd-primary)] px-2.5 py-1.5 text-[10px] font-extrabold text-white"
        >
          {t("trade_community_bridge_cta_traders")}
        </Link>
        <Link
          href="/app/market?panel=bots"
          className="rounded-xl border border-[color:var(--fd-border)] bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-[color:var(--fd-text)]"
        >
          {t("trade_community_bridge_cta_bots")}
        </Link>
        <Link
          href="/app/trade/futures/guide"
          className="rounded-xl border border-[color:var(--fd-border)] bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-[color:var(--fd-primary)]"
        >
          {t("trade_ui_learn_futures")}
        </Link>
      </div>
    </TradeFlowCard>
  );
}
