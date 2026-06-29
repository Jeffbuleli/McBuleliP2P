"use client";

import { useI18n } from "@/components/i18n-provider";
import { P2pRulesPanel } from "@/components/p2p/p2p-rules-panel";
import { P2pSafetyTips } from "@/components/p2p/p2p-safety-tips";
import { HudCornerBrackets, type HudCornerTone } from "@/components/ui/hud-corners";

/** Illustrated rules + stay-safe block for P2P flows. */
export function P2pRulesSection({
  cornerTone = "neutral",
  defaultOpen = true,
}: {
  cornerTone?: HudCornerTone;
  defaultOpen?: boolean;
}) {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden border border-white/10 bg-[#0a1018]/90 p-3">
      <HudCornerBrackets tone={cornerTone} size="sm" />
      <div className="relative">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80">
            {t("p2p_rules_toggle")}
          </h2>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
              cornerTone === "sell"
                ? "border border-amber-400/35 bg-amber-500/15 text-amber-300"
                : cornerTone === "buy"
                  ? "border border-emerald-400/35 bg-emerald-500/15 text-emerald-300"
                  : "border border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
            }`}
          >
            {t("p2p_market_escrow_badge")}
          </span>
        </div>
        {defaultOpen ? (
          <div className="space-y-3">
            <P2pRulesPanel />
            <P2pSafetyTips accentTone={cornerTone} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function P2pSideBadge({ side }: { side: "buy" | "sell" }) {
  const { t } = useI18n();
  const isBuy = side === "buy";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
        isBuy
          ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
          : "border border-amber-400/40 bg-amber-500/15 text-amber-300"
      }`}
    >
      {isBuy ? t("p2p_side_buy") : t("p2p_side_sell")}
    </span>
  );
}
