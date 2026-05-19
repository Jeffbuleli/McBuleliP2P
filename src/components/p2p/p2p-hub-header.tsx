"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { P2pIconEscrow, P2pIconSwap } from "@/components/p2p/p2p-icons";

export function P2pHubHeader() {
  const { t } = useI18n();
  const [showLegal, setShowLegal] = useState(false);

  return (
    <header className="overflow-hidden rounded-2xl border border-stone-700/50 bg-stone-950/60 shadow-lg shadow-black/30">
      <div className="flex items-start gap-3 bg-gradient-to-r from-emerald-950/80 to-stone-950 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white">
          <P2pIconSwap className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-stone-50">{t("p2p_title")}</h1>
          <p className="mt-0.5 text-xs text-stone-400">{t("p2p_home_hint")}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] font-bold text-emerald-200 ring-1 ring-emerald-700/40">
            <P2pIconEscrow className="h-3 w-3" />
            {t("p2p_market_escrow_badge")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowLegal((v) => !v)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-600 text-xs font-bold text-stone-400"
          aria-expanded={showLegal}
          title={t("p2p_legal_info")}
        >
          ?
        </button>
      </div>
      {showLegal ? (
        <p className="border-t border-stone-700/50 px-4 py-2 text-[10px] leading-snug text-stone-400">
          {t("p2p_disclaimer")}
        </p>
      ) : null}
    </header>
  );
}
