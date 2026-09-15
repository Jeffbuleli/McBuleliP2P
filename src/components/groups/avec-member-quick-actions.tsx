"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

export function AvecMemberQuickActions({
  groupId,
  onGoMeeting,
  onGoTreasury,
}: {
  groupId: string;
  onGoMeeting: () => void;
  onGoTreasury: () => void;
}) {
  const { t } = useI18n();
  const btn =
    "flex-1 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-2 py-2.5 text-center text-[11px] font-bold text-[color:var(--fd-text)] active:scale-[0.98]";

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <button type="button" className={btn} onClick={onGoMeeting}>
        {t("avec_action_save")}
      </button>
      <button type="button" className={btn} onClick={onGoTreasury}>
        {t("avec_action_loan")}
      </button>
      <button type="button" className={btn} onClick={onGoTreasury}>
        {t("avec_action_repay")}
      </button>
      <Link href={`#passport`} className={btn} onClick={(e) => {
        e.preventDefault();
        document.getElementById("avec-passport")?.scrollIntoView({ behavior: "smooth" });
      }}>
        {t("avec_action_history")}
      </Link>
      <span className="sr-only">{groupId}</span>
    </div>
  );
}
