"use client";

import { useI18n } from "@/components/i18n-provider";
import {
  P2pIllusDispute,
  P2pIllusEscrow,
  P2pIllusOffPlatform,
  P2pIllusVerify,
} from "@/components/p2p/p2p-illustrations";
import { P2pInfoCard, P2pInfoCardGrid } from "@/components/p2p/p2p-info-card";

/** Compact illustrated P2P rules - replaces long legal paragraphs. */
export function P2pRulesPanel() {
  const { t } = useI18n();

  return (
    <P2pInfoCardGrid>
      <P2pInfoCard
        variant="info"
        illustration={<P2pIllusEscrow />}
        title={t("p2p_card_escrow_title")}
        subtitle={t("p2p_card_escrow_sub")}
      />
      <P2pInfoCard
        variant="warn"
        illustration={<P2pIllusVerify />}
        title={t("p2p_card_verify_title")}
        subtitle={t("p2p_card_verify_sub")}
      />
      <P2pInfoCard
        variant="warn"
        illustration={<P2pIllusOffPlatform />}
        title={t("p2p_card_inorder_title")}
        subtitle={t("p2p_card_inorder_sub")}
      />
      <P2pInfoCard
        variant="info"
        illustration={<P2pIllusDispute />}
        title={t("p2p_card_dispute_title")}
        subtitle={t("p2p_card_dispute_sub")}
      />
    </P2pInfoCardGrid>
  );
}
