"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { P2pIconEscrow, P2pIconSwap } from "@/components/p2p/p2p-icons";

export function P2pHubHeader() {
  const { t } = useI18n();
  const [showLegal, setShowLegal] = useState(false);

  return (
    <header className="fd-card overflow-hidden p-0 shadow-sm">
      <div className="flex items-start gap-3 border-b border-[color:var(--fd-border)] bg-gradient-to-r from-[color:var(--fd-mint)] via-[color:var(--fd-card)] to-[color:var(--fd-card)] px-3 py-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--fd-mint-deep)] text-[color:var(--fd-primary)] ring-1 ring-[color:var(--fd-border)]">
          <P2pIconSwap className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold text-[color:var(--fd-text)]">{t("p2p_title")}</h1>
          <p className="mt-0.5 text-[11px] font-medium text-[color:var(--fd-muted)]">
            {t("p2p_home_hint")}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[color:var(--fd-mint)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--fd-primary)] ring-1 ring-[color:var(--fd-primary)]/20">
            <P2pIconEscrow className="h-3 w-3" />
            {t("p2p_market_escrow_badge")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowLegal((v) => !v)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--fd-border)] bg-white text-xs font-bold text-[color:var(--fd-muted)]"
          aria-expanded={showLegal}
          title={t("p2p_legal_info")}
        >
          ?
        </button>
      </div>
      {showLegal ? (
        <p className="px-3 py-2 text-[10px] leading-snug text-[color:var(--fd-muted)]">
          {t("p2p_disclaimer")}
        </p>
      ) : null}
    </header>
  );
}
