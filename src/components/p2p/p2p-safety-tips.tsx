"use client";

import type React from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  P2pIllusChargeback,
  P2pIllusFakeReceipt,
  P2pIllusImpersonate,
  P2pIllusOffPlatform,
  P2pIllusPostCancel,
  P2pIllusTriangle,
} from "@/components/p2p/p2p-illustrations";
import type { Messages } from "@/i18n/messages";
import { P2pInfoCard } from "@/components/p2p/p2p-info-card";
import type { HudCornerTone } from "@/components/ui/hud-corners";

const TIPS: {
  id: string;
  variant: "warn" | "info";
  Illus: React.ComponentType<{ className?: string }>;
  titleKey: keyof Messages;
  subKey: keyof Messages;
}[] = [
  { id: "fake_receipt", variant: "warn", Illus: P2pIllusFakeReceipt, titleKey: "p2p_tip_fake_title", subKey: "p2p_tip_fake_sub" },
  { id: "post_cancel", variant: "warn", Illus: P2pIllusPostCancel, titleKey: "p2p_tip_cancel_title", subKey: "p2p_tip_cancel_sub" },
  { id: "triangle", variant: "warn", Illus: P2pIllusTriangle, titleKey: "p2p_tip_triangle_title", subKey: "p2p_tip_triangle_sub" },
  { id: "chargeback", variant: "warn", Illus: P2pIllusChargeback, titleKey: "p2p_tip_chargeback_title", subKey: "p2p_tip_chargeback_sub" },
  { id: "fake_escrow", variant: "info", Illus: P2pIllusOffPlatform, titleKey: "p2p_tip_escrow_title", subKey: "p2p_tip_escrow_sub" },
  { id: "impersonate", variant: "info", Illus: P2pIllusImpersonate, titleKey: "p2p_tip_impersonate_title", subKey: "p2p_tip_impersonate_sub" },
];

const ILLUS = "h-8 w-8";

type Props = {
  className?: string;
  /** Tints section title only - cards stay rounded neutrals. */
  accentTone?: HudCornerTone;
};

/** OKX-style anti-scam carousel - horizontal compact cards. */
export function P2pSafetyTips({ className = "", accentTone }: Props) {
  const { t } = useI18n();

  return (
    <section className={className} aria-label={t("p2p_safety_title")}>
      <h2
        className={`mb-1.5 px-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${
          accentTone === "sell"
            ? "text-amber-400/85"
            : accentTone === "buy"
              ? "text-emerald-400/85"
              : "text-[color:var(--fd-muted)]"
        }`}
      >
        {t("p2p_safety_title")}
      </h2>
      <div className="p2p-safety-scroll flex gap-1.5 overflow-x-auto pb-0.5">
        {TIPS.map((tip) => (
          <P2pInfoCard
            key={tip.id}
            compact
            variant={tip.variant}
            illustration={<tip.Illus className={ILLUS} />}
            title={t(tip.titleKey)}
            subtitle={t(tip.subKey)}
            className="p2p-safety-card"
          />
        ))}
      </div>
    </section>
  );
}
