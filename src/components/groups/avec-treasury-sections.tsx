"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecSectionTabs, AvecMoneyNote } from "@/components/groups/avec-ui";
import { AvecTreasuryFunds } from "@/components/groups/avec-treasury-funds";
import { AvecSocialAidPanel } from "@/components/groups/avec-social-aid-panel";
import { AvecLoansPanel } from "@/components/groups/avec-loans-panel";
import { AvecClosurePanel } from "@/components/groups/avec-closure-panel";
import { AvecPayoutPanel } from "@/components/groups/avec-payout-panel";
import { AvecBucketTransferGovernance } from "@/components/groups/avec-bucket-transfer-governance";
import type { AvecMemberRow } from "@/components/groups/avec-member-list";

type Section = "funds" | "loans" | "aid" | "close";

export function AvecTreasurySections({
  groupId,
  myUserId,
  members,
  canContribute,
  canAdmin,
  canModerateMembership,
  treasuryFunds,
  fundsRefresh,
  onFundsRefresh,
  onReload,
}: {
  groupId: string;
  myUserId?: string;
  members: AvecMemberRow[];
  canContribute: boolean;
  canAdmin: boolean;
  canModerateMembership: boolean;
  treasuryFunds: { penaltiesUsdt: number; interestUsdt: number } | null;
  fundsRefresh: number;
  onFundsRefresh: () => void;
  onReload: () => void;
}) {
  const { t } = useI18n();
  const [section, setSection] = useState<Section>("funds");

  const tabs = [
    { id: "funds", label: t("avec_caisse_tab_funds") },
    { id: "loans", label: t("avec_caisse_tab_loans") },
    { id: "aid", label: t("avec_caisse_tab_aid") },
    ...(canModerateMembership
      ? [{ id: "close", label: t("avec_caisse_tab_close") }]
      : []),
  ];

  return (
    <div className="space-y-3">
      <AvecMoneyNote>{t("avec_money_ledger_note")}</AvecMoneyNote>
      <AvecSectionTabs
        tabs={tabs}
        active={section}
        onChange={(id) => setSection(id as Section)}
      />

      {section === "funds" ? (
        <div className="space-y-3">
          <AvecTreasuryFunds groupId={groupId} onRefreshKey={fundsRefresh} />
          {canAdmin && treasuryFunds ? (
            <AvecBucketTransferGovernance
              groupId={groupId}
              penaltiesUsdt={treasuryFunds.penaltiesUsdt}
              interestUsdt={treasuryFunds.interestUsdt}
              canPropose={canAdmin}
              onDone={onFundsRefresh}
            />
          ) : null}
        </div>
      ) : null}

      {section === "loans" ? (
        <AvecLoansPanel
          groupId={groupId}
          members={members}
          myUserId={myUserId}
          onDone={() => {
            onFundsRefresh();
            onReload();
          }}
        />
      ) : null}

      {section === "aid" ? (
        <AvecSocialAidPanel
          groupId={groupId}
          myUserId={myUserId}
          canRequest={canContribute}
          onDone={() => {
            onFundsRefresh();
            onReload();
          }}
        />
      ) : null}

      {section === "close" && canModerateMembership ? (
        <div className="space-y-3">
          <AvecClosurePanel
            groupId={groupId}
            isAdmin={canAdmin}
            onDone={() => {
              onFundsRefresh();
              onReload();
            }}
          />
          <AvecPayoutPanel
            groupId={groupId}
            members={members}
            myUserId={myUserId}
            onDone={() => {
              onFundsRefresh();
              onReload();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
