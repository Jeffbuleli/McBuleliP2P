"use client";

import Image from "next/image";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { P2pRulesSection } from "@/components/p2p/p2p-rules-section";
import { P2pIconEscrow } from "@/components/p2p/p2p-icons";
import { HudCornerBrackets, type HudCornerTone } from "@/components/ui/hud-corners";
import { BRAND_LOGO_256 } from "@/lib/brand-logo";

function P2pHubLogo({ size }: { size: number }) {
  const inner = Math.round(size * 0.72);
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)] ring-1 ring-[color:var(--fd-primary)]/10"
      style={{ width: size, height: size }}
    >
      <Image
        src={BRAND_LOGO_256}
        alt=""
        width={inner}
        height={inner}
        className="h-full w-full object-cover"
        unoptimized
      />
    </span>
  );
}

export function P2pHubHeader({
  compact = false,
  marketCornerTone = "neutral",
}: {
  compact?: boolean;
  marketCornerTone?: HudCornerTone;
}) {
  const { t } = useI18n();
  const [showRules, setShowRules] = useState(false);

  if (compact) {
    return (
      <header className="relative overflow-hidden rounded-xl border border-cyan-400/20 bg-[#0a1018]/90 px-2.5 py-2 backdrop-blur-sm">
        <HudCornerBrackets tone={marketCornerTone} size="sm" />
        <div className="relative flex items-center gap-2">
          <P2pHubLogo size={32} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-sm font-bold text-[color:var(--fd-text)]">{t("p2p_title")}</h1>
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[color:var(--fd-mint)] px-1.5 py-px text-[8px] font-extrabold uppercase tracking-wide text-[color:var(--fd-primary)]">
                <P2pIconEscrow className="h-2.5 w-2.5" />
                {t("p2p_market_escrow_badge")}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRules((v) => !v)}
            className={`flex h-8 shrink-0 items-center rounded-full border px-2.5 text-[10px] font-bold transition-colors active:scale-[0.98] ${
              showRules
                ? "border-emerald-400/45 bg-emerald-500/15 text-emerald-300"
                : "border-white/12 bg-[#050810]/85 text-[color:var(--fd-muted)]"
            }`}
            aria-expanded={showRules}
          >
            {t("p2p_rules_toggle")}
          </button>
        </div>
        {showRules ? (
          <div className="relative mt-2 border-t border-[color:var(--fd-border)] pt-2">
            <P2pRulesSection cornerTone={marketCornerTone} />
          </div>
        ) : null}
      </header>
    );
  }

  return (
    <header className="fd-card overflow-hidden p-0 shadow-sm">
      <div className="flex items-start gap-3 border-b border-[color:var(--fd-border)] bg-gradient-to-r from-[color:var(--fd-mint)] via-[color:var(--fd-card)] to-[color:var(--fd-card)] px-3 py-3">
        <P2pHubLogo size={44} />
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
          onClick={() => setShowRules((v) => !v)}
          className={`flex h-9 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[10px] font-bold transition-colors active:scale-[0.98] ${
            showRules
              ? "border-emerald-400/45 bg-emerald-500/15 text-emerald-300"
              : "border-white/12 bg-[#050810]/85 text-[color:var(--fd-muted)]"
          }`}
          aria-expanded={showRules}
          title={t("p2p_rules_toggle")}
        >
          {t("p2p_rules_toggle")}
        </button>
      </div>
      {showRules ? (
        <div className="relative border-t border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-2.5">
          <P2pRulesSection cornerTone={marketCornerTone} />
        </div>
      ) : null}
    </header>
  );
}
