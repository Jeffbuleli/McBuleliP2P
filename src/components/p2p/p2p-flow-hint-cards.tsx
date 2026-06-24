"use client";

import { useI18n } from "@/components/i18n-provider";
import { P2pIllusBuy, P2pIllusPayFiat, P2pIllusSell, P2pIllusVerify } from "@/components/p2p/p2p-illustrations";
import { P2pInfoCard } from "@/components/p2p/p2p-info-card";
import type { P2pMarketView } from "@/lib/p2p-market-view";

type Props = {
  view: P2pMarketView;
  className?: string;
};

const ILLUS = "h-8 w-8";

/** Contextual BUY/SELL flow hints on the marketplace tab. */
export function P2pFlowHintCards({ view, className = "" }: Props) {
  const { t } = useI18n();
  const isBuy = view === "buy";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
      <P2pInfoCard
        compact
        variant={isBuy ? "buy" : "sell"}
        illustration={isBuy ? <P2pIllusBuy className={ILLUS} /> : <P2pIllusSell className={ILLUS} />}
        title={isBuy ? t("p2p_card_buy_flow_title") : t("p2p_card_sell_flow_title")}
        subtitle={isBuy ? t("p2p_card_buy_flow_sub") : t("p2p_card_sell_flow_sub")}
      />
      <div className="grid grid-cols-2 gap-1.5">
        <P2pInfoCard
          compact
          variant="info"
          illustration={<P2pIllusPayFiat className={ILLUS} />}
          title={t("p2p_card_momo_title")}
          subtitle={t("p2p_card_momo_sub")}
        />
        <P2pInfoCard
          compact
          variant="warn"
          illustration={<P2pIllusVerify className={ILLUS} />}
          title={t("p2p_card_check_title")}
          subtitle={t("p2p_card_check_sub")}
        />
      </div>
    </div>
  );
}
